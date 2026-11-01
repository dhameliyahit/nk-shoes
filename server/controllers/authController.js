import crypto from "crypto";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { isValidIndianMobile, sanitizeIndianMobile } from "../utils/validators.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../services/emailService.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    let cleanPhone = "";
    if (phone) {
      cleanPhone = sanitizeIndianMobile(phone);
      if (!isValidIndianMobile(cleanPhone)) {
        return res.status(400).json({ message: "Please provide a valid 10-digit mobile number starting with 6-9" });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      // If user exists but is not verified, allow them to re-verify
      if (!userExists.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(24).toString("hex");

        userExists.verificationOTP = otp;
        userExists.verificationToken = token;
        userExists.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await userExists.save();

        try {
          await sendVerificationEmail(userExists, otp, token);
        } catch (emailErr) {
          console.warn("[Register Warning] Email could not be sent (check SMTP settings):", emailErr.message);
        }

        return res.status(200).json({
          message: "Account already created but not verified. A new verification OTP was sent to your email.",
          requiresVerification: true,
          email: userExists.email,
        });
      }
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Generate 6-digit OTP and secure verification token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString("hex");

    const user = await User.create({
      name,
      email,
      password,
      phone: cleanPhone || undefined,
      isVerified: false,
      verificationOTP: otp,
      verificationToken: token,
      verificationOTPExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    // Try sending email verification OTP
    try {
      await sendVerificationEmail(user, otp, token);
    } catch (emailErr) {
      console.warn("[Register Warning] Email could not be sent (check SMTP settings):", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please verify your email with the 6-digit OTP sent to your inbox.",
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp, token } = req.body;

    if (!email || (!otp && !token)) {
      return res.status(400).json({ message: "Email and OTP code (or token) are required" });
    }

    const user = await User.findOne({ email }).select(
      "+verificationOTP +verificationOTPExpires +verificationToken +refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    if (user.isVerified) {
      // User is already verified, generate tokens and log in directly
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: "Account already verified",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
      });
    }

    // Verify via Token or OTP
    let isValid = false;
    if (token && user.verificationToken === token) {
      isValid = true;
    } else if (otp && user.verificationOTP === otp.trim()) {
      if (user.verificationOTPExpires && user.verificationOTPExpires > new Date()) {
        isValid = true;
      } else {
        return res.status(400).json({ message: "Verification OTP has expired. Please request a new code." });
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    user.verificationToken = undefined;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    // Send welcome email asynchronously
    try {
      await sendWelcomeEmail(user);
    } catch (e) {
      // Non-blocking
    }

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to NK-SHOES.",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select(
      "+verificationOTP +verificationOTPExpires +verificationToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified. Please sign in." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString("hex");

    user.verificationOTP = otp;
    user.verificationToken = token;
    user.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user, otp, token);
    } catch (emailErr) {
      console.warn("[Resend Warning] Email could not be sent:", emailErr.message);
    }

    res.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (user && (await user.matchPassword(password))) {
      // Check if user has completed email verification
      if (!user.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(24).toString("hex");

        user.verificationOTP = otp;
        user.verificationToken = token;
        user.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await user.save();

        try {
          await sendVerificationEmail(user, otp, token);
        } catch (emailErr) {
          console.warn("[Login Warning] Verification email could not be sent:", emailErr.message);
        }

        return res.status(403).json({
          message: "Please verify your email address to sign in. A new 6-digit code has been sent to your email.",
          requiresVerification: true,
          email: user.email,
        });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        accessToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      addresses: user.addresses,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.phone !== undefined) user.phone = req.body.phone.trim();

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user.password = req.body.password;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      isVerified: updated.isVerified,
      addresses: updated.addresses,
      createdAt: updated.createdAt,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ message: "All required address fields must be provided" });
    }

    if (isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push({
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      isDefault: Boolean(isDefault) || user.addresses.length === 0,
    });

    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === req.params.id;
    });

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
