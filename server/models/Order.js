import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestEmail: {
      type: String,
      default: "",
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
          set: (v) => (v && mongoose.Types.ObjectId.isValid(v) ? v : undefined),
        },
        name: String,
        image: String,
        size: String,
        color: String,
        quantity: Number,
        price: Number,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      alternatePhone: { type: String, default: "" },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      district: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cod", "phonepe", "card", "upi"],
      default: "cod",
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: ["processing", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "processing",
    },
    courierName: {
      type: String,
      default: "",
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    trackingUrl: {
      type: String,
      default: "",
    },
    cancelReason: {
      type: String,
      default: "",
    },
    orderNotes: String,
    giftWrap: {
      type: Boolean,
      default: false,
    },
    promoCode: String,
    phonepeTransactionId: String,
    merchantOrderId: {
      type: String,
      default: null,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
