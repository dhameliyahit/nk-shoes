import express from "express";
import { getPublicPages, getPageBySlug } from "../controllers/pageController.js";

const router = express.Router();

router.get("/", getPublicPages);
router.get("/:slug", getPageBySlug);

export default router;
