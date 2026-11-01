import { Env, StandardCheckoutClient, StandardCheckoutPayRequest } from "pg-sdk-node";
import config from "./env.js";
import Setting from "../models/Setting.js";

const defaultClient = StandardCheckoutClient.getInstance(
  config.phonepe.clientId || "TEST-M23J6356GMKLB_25101",
  config.phonepe.clientSecret || "ZGM4NzNjNjgtN2Y2NC00NWU1LWI2NjAtNDczZDJlOTYxY2Fm",
  config.phonepe.clientVersion || 1,
  config.phonepe.env === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX
);

/**
 * Dynamically resolves PhonePe client instance with active store settings if present
 */
export const getPhonePeClient = async () => {
  try {
    const storeSetting = await Setting.findOne({ key: "store_settings" });
    if (storeSetting && storeSetting.value && storeSetting.value.payment) {
      const p = storeSetting.value.payment;
      const clientId = p.phonepeClientId || config.phonepe.clientId || "TEST-M23J6356GMKLB_25101";
      const clientSecret = p.phonepeClientSecret || config.phonepe.clientSecret || "ZGM4NzNjNjgtN2Y2NC00NWU1LWI2NjAtNDczZDJlOTYxY2Fm";
      const clientVersion = Number(p.phonepeClientVersion || config.phonepe.clientVersion || 1);
      const env = (p.phonepeEnv || config.phonepe.env || "SANDBOX").toUpperCase() === "PRODUCTION"
        ? Env.PRODUCTION
        : Env.SANDBOX;

      return StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    }
  } catch (err) {
    console.warn("[PhonePe Dynamic Init Warning]:", err.message);
  }

  return defaultClient;
};

export { defaultClient as phonePeClient, StandardCheckoutPayRequest, Env };
export default defaultClient;

