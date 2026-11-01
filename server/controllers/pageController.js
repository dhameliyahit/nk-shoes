import Page from "../models/Page.js";

/**
 * Controller: Get published page by slug
 * @route GET /api/pages/:slug
 * @access Public
 */
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.toLowerCase().trim();
    const page = await Page.findOne({ slug: cleanSlug, isPublished: true });

    if (!page) {
      return res.status(404).json({ message: `Page '/${cleanSlug}' not found` });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller: Get list of all published pages
 * @route GET /api/pages
 * @access Public
 */
export const getPublicPages = async (req, res) => {
  try {
    const pages = await Page.find({ isPublished: true })
      .select("title slug category excerpt updatedAt")
      .sort({ category: 1, title: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller: Get all pages for admin (including drafts)
 * @route GET /api/admin/pages
 * @access Private/Admin
 */
export const getAllPagesAdmin = async (req, res) => {
  try {
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller: Create new CMS page
 * @route POST /api/admin/pages
 * @access Private/Admin
 */
export const createPageAdmin = async (req, res) => {
  try {
    const { title, slug, category, content, excerpt, isPublished, metaTitle, metaDescription } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: "Title and slug are required" });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");
    const existing = await Page.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ message: `Page with slug '/${cleanSlug}' already exists` });
    }

    const page = new Page({
      title,
      slug: cleanSlug,
      category: category || "General",
      content: content || "",
      excerpt: excerpt || "",
      isPublished: isPublished !== undefined ? isPublished : true,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || "",
    });

    const saved = await page.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller: Update CMS page
 * @route PUT /api/admin/pages/:id
 * @access Private/Admin
 */
export const updatePageAdmin = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    if (req.body.slug && req.body.slug !== page.slug) {
      const cleanSlug = req.body.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");
      const existing = await Page.findOne({ slug: cleanSlug, _id: { $ne: page._id } });
      if (existing) {
        return res.status(400).json({ message: `Page with slug '/${cleanSlug}' already exists` });
      }
      page.slug = cleanSlug;
    }

    if (req.body.title !== undefined) page.title = req.body.title;
    if (req.body.category !== undefined) page.category = req.body.category;
    if (req.body.content !== undefined) page.content = req.body.content;
    if (req.body.excerpt !== undefined) page.excerpt = req.body.excerpt;
    if (req.body.isPublished !== undefined) page.isPublished = req.body.isPublished;
    if (req.body.metaTitle !== undefined) page.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription !== undefined) page.metaDescription = req.body.metaDescription;

    const updated = await page.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller: Delete CMS page
 * @route DELETE /api/admin/pages/:id
 * @access Private/Admin
 */
export const deletePageAdmin = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    await page.deleteOne();
    res.json({ message: "Page deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
