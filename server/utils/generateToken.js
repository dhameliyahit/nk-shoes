import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateAccessToken = (id) => {
  return jwt.sign({ id }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpire,
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtAccessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};
