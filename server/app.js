import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any incoming origin in development (localhost, 127.0.0.1, IP, browser extensions)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "NK-SHOES Unified API is active" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler strictly for unmatched /api requests
app.use("/api/*", notFound);
app.use(errorHandler);

export default app;
