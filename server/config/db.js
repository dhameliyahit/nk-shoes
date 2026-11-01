import mongoose from "mongoose";
import Category, { DEFAULT_CATEGORIES } from "../models/Category.js";
import Product, { DEFAULT_FLAGSHIP_PRODUCTS } from "../models/Product.js";
import Setting from "../models/Setting.js";
import Page from "../models/Page.js";
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_EMAIL_SETTING,
  INITIAL_SIZE_GUIDE,
} from "../seeds/settingSeed.js";
import { INITIAL_PAGES } from "../seeds/pageSeed.js";

/**
 * Connect to MongoDB and perform one-time initial seed if database is empty
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nk-shoes"
    );
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // One-time startup check: Seed only if collections are completely empty
    await seedInitialDataIfNeeded();
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Seed initial categories, products, and store settings once at startup if collections are empty.
 * Never called inside API request lifecycles.
 */
async function seedInitialDataIfNeeded() {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log("[Database Seeder] Categories collection is empty. Seeding initial categories...");
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log(`[Database Seeder] Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("[Database Seeder] Products collection is empty. Seeding initial products...");
      await Product.insertMany(DEFAULT_FLAGSHIP_PRODUCTS);
      console.log(`[Database Seeder] Seeded ${DEFAULT_FLAGSHIP_PRODUCTS.length} default products.`);
    }

    // Seed store_settings into settings collection in MongoDB
    const hasStoreSettings = await Setting.findOne({ key: "store_settings" });
    if (!hasStoreSettings) {
      console.log("[Database Seeder] Seeding initial store_settings into MongoDB...");
      await Setting.create(INITIAL_STORE_SETTINGS);
      console.log("[Database Seeder] 'store_settings' seeded into MongoDB settings collection.");
    }

    // Seed email into settings collection in MongoDB
    const hasEmailSetting = await Setting.findOne({ key: "email" });
    if (!hasEmailSetting) {
      await Setting.create(INITIAL_EMAIL_SETTING);
      console.log("[Database Seeder] 'email' setting seeded into MongoDB.");
    }

    // Seed size_guide into settings collection in MongoDB
    const hasSizeGuide = await Setting.findOne({ key: "size_guide" });
    if (!hasSizeGuide) {
      await Setting.create(INITIAL_SIZE_GUIDE);
      console.log("[Database Seeder] 'size_guide' setting seeded into MongoDB.");
    }

    // Seed initial dynamic CMS pages into pages collection in MongoDB
    const pageCount = await Page.countDocuments();
    if (pageCount === 0) {
      console.log("[Database Seeder] Seeding initial CMS pages into MongoDB...");
      await Page.insertMany(INITIAL_PAGES);
      console.log(`[Database Seeder] Seeded ${INITIAL_PAGES.length} CMS pages into MongoDB.`);
    }
  } catch (err) {
    console.warn("[Database Seeder Warning] Initial seed check failed:", err.message);
  }
}

export default connectDB;
