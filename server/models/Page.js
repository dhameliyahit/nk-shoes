import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["Support", "Policy", "Company", "General"],
      default: "General",
    },
    content: {
      type: String,
      required: true,
      default: "",
    },
    excerpt: {
      type: String,
      default: "",
    },
    displayDate: {
      type: String,
      default: "",
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    metaTitle: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Page = mongoose.model("Page", pageSchema);
export default Page;
