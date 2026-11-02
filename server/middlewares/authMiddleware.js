import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwtAccessSecret);
      } catch (err) {
        // If expired or error, check if user is admin - admin sessions never expire
        if (err.name === "TokenExpiredError" || err.message?.includes("jwt expired")) {
          const unverified = jwt.decode(token);
          if (unverified && unverified.id) {
            const adminUser = await User.findById(unverified.id).select("-password");
            if (adminUser && adminUser.role === "admin") {
              req.user = adminUser;
              return next();
            }
          }
        }
        throw err;
      }

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Optional authentication: Attaches req.user if valid token exists,
 * but allows guest checkouts to proceed smoothly.
 */
export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, config.jwtAccessSecret);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Token invalid or expired, continue as guest
    }
  }
  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
};
