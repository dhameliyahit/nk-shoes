import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from server/.env first, then root if needed
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRE || "7d",
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "14d",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  phonepe: {
    clientId: process.env.PHONEPE_CLIENT_ID || "TEST-M23J6356GMKLB_25101",
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || "ZGM4NzNjNjgtN2Y2NC00NWU1LWI2NjAtNDczZDJlOTYxY2Fm",
    clientVersion: Number(process.env.PHONEPE_CLIENT_VERSION || 1),
    env: process.env.PHONEPE_ENV || "SANDBOX",
  },
};

export default config;
