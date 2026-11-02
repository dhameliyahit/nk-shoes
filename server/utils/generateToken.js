import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateAccessToken = (id, role = "user") => {
  const isAdmin = role === "admin";
  return jwt.sign({ id, role }, config.jwtAccessSecret, {
    expiresIn: isAdmin ? "36500d" : (config.jwtAccessExpire || "30d"),
  });
};

export const generateRefreshToken = (id, role = "user") => {
  const isAdmin = role === "admin";
  return jwt.sign({ id, role }, config.jwtRefreshSecret, {
    expiresIn: isAdmin ? "36500d" : (config.jwtRefreshExpire || "60d"),
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtAccessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};
