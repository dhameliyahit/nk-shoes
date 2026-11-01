import mongoose from "mongoose";
import { randomUUID } from "crypto";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { getPhonePeClient, StandardCheckoutPayRequest } from "../config/phonepe.js";
import config from "../config/env.js";

/**
 * Controller: Verify Indian Pincode via public India Post API
 * @route GET /api/orders/verify-pincode/:pincode
 * @access Public
 */
export const verifyPincodeController = async (req, res) => {
  try {
    const { pincode } = req.params;
    const cleanPin = pincode ? pincode.trim() : "";

    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "PIN code must be a valid 6-digit Indian postal code",
      });
    }

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        valid: false,
        message: "Unable to reach Indian Postal directory",
      });
    }

    const data = await response.json();
    if (
      Array.isArray(data) &&
      data[0]?.Status === "Success" &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const primary = data[0].PostOffice[0];
      const localities = data[0].PostOffice.map((po) => po.Name).filter(Boolean);
      return res.json({
        success: true,
        valid: true,
        pincode: cleanPin,
        district: primary.District,
        city: primary.District || primary.Block || primary.Name,
        state: primary.State,
        circle: primary.Circle,
        localities,
      });
    }

    return res.json({
      success: true,
      valid: false,
      message: "Invalid Indian PIN code. No delivery post office found.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      valid: false,
      message: error.message || "Failed to verify PIN code",
    });
  }
};

/**
 * Controller: Create Order with end-to-end address & phone validation
 * @route POST /api/orders
 * @access Public (Registered or Guest)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      discountAmount,
      orderNotes,
      giftWrap,
      giftMessage,
      promoCode,
      email,
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Please add items before checkout." });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required." });
    }

    const {
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      address,
      city,
      state,
      pincode,
      district,
    } = shippingAddress;

    const line1 = addressLine1 || address;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Full Name is required for delivery." });
    }

    if (!line1 || !line1.trim()) {
      return res.status(400).json({ message: "Delivery address line is required." });
    }

    // 1. Indian Phone Number Validation: exactly 10 digits starting with 6, 7, 8, or 9
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        message: "Please enter a valid number.",
      });
    }

    // 2. Extra / Alternate phone number validation (if provided)
    let cleanAltPhone = "";
    if (alternatePhone && alternatePhone.trim()) {
      cleanAltPhone = alternatePhone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanAltPhone)) {
        return res.status(400).json({
          message: "Alternate mobile number must be a valid number.",
        });
      }
    }

    // 3. Indian PIN Code Validation: exactly 6 digits
    const cleanPincode = pincode ? pincode.toString().trim() : "";
    if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit PIN code.",
      });
    }

    if (!city || !city.trim() || !state || !state.trim()) {
      return res.status(400).json({
        message: "City and State are required. Please verify your PIN code.",
      });
    }

    // Normalize order items and safely resolve product ObjectIds (handles ObjectIds, slugs, and legacy IDs)
    const formattedItems = await Promise.all(
      orderItems.map(async (item) => {
        const rawProd = item.product?._id || item.product || item._id;
        let resolvedProductId = undefined;

        if (rawProd && mongoose.Types.ObjectId.isValid(rawProd)) {
          resolvedProductId = rawProd;
        } else if (rawProd && typeof rawProd === "string" && rawProd.trim()) {
          // Attempt finding product in MongoDB by slug or SKU
          try {
            const foundProd = await Product.findOne({
              $or: [{ slug: rawProd.toLowerCase() }, { sku: rawProd }],
            }).select("_id");
            if (foundProd) {
              resolvedProductId = foundProd._id;
            }
          } catch {
            // Ignore lookup error
          }
        }

        return {
          product: resolvedProductId || undefined,
          name: item.name || item.product?.name || "Footwear",
          image: item.image || item.product?.images?.[0] || "",
          size: item.size || "Standard",
          color: item.color || "Default",
          quantity: Number(item.quantity || item.qty || 1),
          price: Number(item.price || item.product?.price || 0),
        };
      })
    );

    const order = new Order({
      orderItems: formattedItems,
      user: req.user ? req.user._id : undefined,
      guestEmail: email || shippingAddress.email || (req.user ? req.user.email : ""),
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        alternatePhone: cleanAltPhone,
        addressLine1: line1.trim(),
        addressLine2: shippingAddress.addressLine2 || "",
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPincode,
        district: district || city.trim(),
      },
      paymentMethod: ["cod", "card", "upi", "phonepe"].includes(paymentMethod)
        ? paymentMethod
        : "cod",
      itemsPrice: Number(itemsPrice || 0),
      shippingPrice: Number(shippingPrice || 0),
      taxPrice: Number(taxPrice || 0),
      totalPrice: Number(totalPrice || 0),
      discountAmount: Number(discountAmount || 0),
      orderNotes: orderNotes || "",
      giftWrap: Boolean(giftWrap),
      giftMessage: giftMessage || "",
      promoCode: promoCode || "",
      isPaid: false,
      paymentStatus: "Pending",
      orderStatus: paymentMethod === "phonepe" ? "processing" : "confirmed",
    });

    // 1) Handle PhonePe Standard Checkout Flow
    if (paymentMethod === "phonepe") {
      const merchantOrderId = randomUUID();
      order.merchantOrderId = merchantOrderId;
      const createdOrder = await order.save();

      // Amount in Paise (e.g. Rs 5999 = 599900 paise)
      const amountInPaise = Math.max(100, Math.round(Number(totalPrice || 0) * 100));
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const redirectUrl = `${baseUrl}/api/orders/phonepe/callback?merchantOrderId=${merchantOrderId}`;

      const payload = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaise)
        .redirectUrl(redirectUrl)
        .build();

      const activePhonePe = await getPhonePeClient();
      const phonePeResponse = await activePhonePe.pay(payload);

      // Clear cart if user is logged in
      if (req.user) {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }).catch(() => {});
      }

      return res.status(201).json({
        ...createdOrder.toObject(),
        checkoutUrl: phonePeResponse.redirectUrl,
      });
    }

    // 2) Handle Cash On Delivery (COD) Flow
    const createdOrder = await order.save();

    // Dynamically increment salesCount and decrement stock for ordered items
    if (Array.isArray(formattedItems) && formattedItems.length > 0) {
      for (const item of formattedItems) {
        const prodId = item.product;
        const qty = Number(item.quantity || 1);
        if (prodId && mongoose.Types.ObjectId.isValid(prodId)) {
          if (item.size) {
            await Product.updateOne(
              { _id: prodId, "sizes.size": item.size },
              {
                $inc: {
                  salesCount: qty,
                  stock: -qty,
                  "sizes.$.stock": -qty,
                },
              }
            ).catch(() => {});
          } else {
            await Product.findByIdAndUpdate(prodId, {
              $inc: { salesCount: qty, stock: -qty },
            }).catch(() => {});
          }
        }
      }
    }

    // Clear cart if user is logged in
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }).catch(() => {});
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("[Order Controller Error]:", error);
    res.status(500).json({ message: error.message || "Failed to process order" });
  }
};

/**
 * Controller: Handle PhonePe Gateway Webhook / Redirect Callback
 * @route GET /api/orders/phonepe/callback
 * @access Public (PhonePe Redirect)
 */
export const phonepeCallbackController = async (req, res) => {
  try {
    const { merchantOrderId } = req.query;
    if (!merchantOrderId) {
      return res.redirect(`${config.clientUrl}/checkout/failed?reason=missing_merchant_order_id`);
    }

    const activePhonePe = await getPhonePeClient();
    const response = await activePhonePe.getOrderStatus(merchantOrderId);
    const order = await Order.findOne({ merchantOrderId });

    if (!order) {
      return res.redirect(`${config.clientUrl}/checkout/failed?reason=order_not_found`);
    }

    if (response.state === "COMPLETED") {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentStatus = "Success";
      order.orderStatus = "confirmed";
      order.phonepeTransactionId = response.transactionId || merchantOrderId;
      order.paymentResult = {
        id: response.transactionId || merchantOrderId,
        status: "COMPLETED",
        update_time: new Date().toISOString(),
      };
      await order.save();

      // Decrement product inventory upon confirmed payment
      if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          const prodId = item.product;
          const qty = Number(item.quantity || 1);
          if (prodId && mongoose.Types.ObjectId.isValid(prodId)) {
            if (item.size) {
              await Product.updateOne(
                { _id: prodId, "sizes.size": item.size },
                {
                  $inc: {
                    salesCount: qty,
                    stock: -qty,
                    "sizes.$.stock": -qty,
                  },
                }
              ).catch(() => {});
            } else {
              await Product.findByIdAndUpdate(prodId, {
                $inc: { salesCount: qty, stock: -qty },
              }).catch(() => {});
            }
          }
        }
      }

      return res.redirect(
        `${config.clientUrl}/checkout/success?orderId=${order._id}&merchantOrderId=${merchantOrderId}`
      );
    } else {
      order.paymentStatus = "Failed";
      order.orderStatus = "cancelled";
      await order.save();

      return res.redirect(
        `${config.clientUrl}/checkout/failed?orderId=${order._id}&reason=payment_failed`
      );
    }
  } catch (error) {
    console.error("[PhonePe Callback Error]:", error);
    return res.redirect(`${config.clientUrl}/checkout/failed?reason=verification_exception`);
  }
};

/**
 * Controller: Get PhonePe Order Status by merchantOrderId
 * @route GET /api/orders/phonepe/status/:merchantOrderId
 * @access Public
 */
export const getPhonepeStatusController = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const activePhonePe = await getPhonePeClient();
    const response = await activePhonePe.getOrderStatus(merchantOrderId);
    const order = await Order.findOne({ merchantOrderId });

    return res.json({
      success: true,
      state: response.state,
      transactionId: response.transactionId,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (order) {
      if (!order.user || (req.user && (order.user._id.toString() === req.user._id.toString() || req.user.role === "admin"))) {
        res.json(order);
      } else {
        res.status(403).json({ message: "Not authorized to view this order" });
      }
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.user) {
      if (!req.user || (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Not authorized to cancel this order" });
      }
    }
    if (["shipped", "out_for_delivery", "delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: "Order has already been dispatched/delivered and cannot be cancelled directly.",
      });
    }
    const reasonText = req.body.reason || req.body.cancelReason || "Cancelled by customer request";
    order.orderStatus = "cancelled";
    order.cancelReason = reasonText;
    if (req.body.notes || req.body.orderNotes) {
      const extraNotes = req.body.notes || req.body.orderNotes;
      order.orderNotes = order.orderNotes
        ? `${order.orderNotes} | Cancel Note: ${extraNotes}`
        : `Cancel Note: ${extraNotes}`;
    }
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
