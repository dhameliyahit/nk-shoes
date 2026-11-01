import mongoose from "mongoose";

/**
 * Flexible Setting Schema
 * - key: unique identifier for the setting (e.g., 'email', 'general', 'payment')
 * - value: flexible Mixed type supporting strings, numbers, booleans, objects, arrays
 * - description: optional human-readable description
 * - group: optional category grouping (e.g., 'system', 'notifications', 'integrations')
 * - strict: false allows arbitrary extra fields if needed
 */
const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    description: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      default: "general",
      trim: true,
      lowercase: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false, // Ensures maximum schema flexibility for any arbitrary structure
  }
);

// Helper static method to get setting value by key directly from database
settingSchema.statics.get = async function (key) {
  const setting = await this.findOne({ key: key.toLowerCase().trim() });
  return setting ? setting.value : null;
};

// Helper static method to set/upsert setting value by key
settingSchema.statics.set = async function (
  key,
  value,
  { description = "", group = "general" } = {}
) {
  const normalizedKey = key.toLowerCase().trim();
  const updateData = { value };
  if (description) updateData.description = description;
  if (group) updateData.group = group.toLowerCase().trim();

  const setting = await this.findOneAndUpdate(
    { key: normalizedKey },
    { $set: updateData, $setOnInsert: { key: normalizedKey } },
    { new: true, upsert: true, runValidators: true }
  );

  return setting;
};

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;

