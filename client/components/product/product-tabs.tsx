"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  RiStarFill,
  RiStarLine,
  RiCheckLine,
  RiThumbUpLine,
  RiThumbUpFill,
  RiTruckLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiEditLine,
  RiCloseLine,
  RiSparklingLine,
  RiInformationLine,
  RiLoader4Line,
} from "react-icons/ri";
import { Product, ProductReview } from "@/types/product";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addProductReview, voteReviewHelpful } from "@/services/productService";
import { useAuth } from "@/context/auth-context";

interface ProductTabsProps {
  product: Product;
  onReviewAdded?: (newReview: any, newRatings?: number, newCount?: number) => void;
}

interface UserReview {
  id: string;
  author: string;
  city?: string;
  date: string;
  rating: number;
  fit: "Runs Small" | "True to Size" | "Runs Large";
  title: string;
  content: string;
  verified: boolean;
  helpfulCount: number;
  isUserAdded?: boolean;
}

const INITIAL_REVIEWS: UserReview[] = [
  {
    id: "r1",
    author: "Rahul S.",
    city: "Mumbai",
    date: "12 Oct 2026",
    rating: 5,
    fit: "True to Size",
    title: "Best daily comfort sneaker I've ever owned",
    content:
      "The cushioning on these is unbelievable. Wore them for an 8-hour shift and my feet felt completely fresh. Upper knit breathes exceptionally well in warm weather.",
    verified: true,
    helpfulCount: 28,
  },
  {
    id: "r2",
    author: "Pooja M.",
    city: "Bengaluru",
    date: "28 Sep 2026",
    rating: 5,
    fit: "True to Size",
    title: "Looks even better in person!",
    content:
      "Material quality is premium and lightweight. Fast delivery and the silhouette pairs effortlessly with gym leggings, jeans, or cargo pants.",
    verified: true,
    helpfulCount: 19,
  },
  {
    id: "r3",
    author: "Arjun K.",
    city: "Delhi NCR",
    date: "14 Sep 2026",
    rating: 4,
    fit: "True to Size",
    title: "Solid arch support and reliable outsole grip",
    content:
      "Great ankle collar padding and durable rubber lugs on the sole. Plenty of traction on wet pavements. Only reason for 4 stars is I had to break them in for 2 days.",
    verified: true,
    helpfulCount: 11,
  },
];

function getInitialReviews(product: Product): UserReview[] {
  if (product.reviews && product.reviews.length > 0) {
    return product.reviews.map((r) => ({
      id: r.id || r._id || `rev-${Math.random()}`,
      author: r.author,
      city: r.city || "India",
      date:
        r.date ||
        (r.createdAt
          ? new Date(r.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Verified Buyer"),
      rating: r.rating,
      fit: r.fit || "True to Size",
      title: r.title,
      content: r.content,
      verified: r.verified !== undefined ? r.verified : true,
      helpfulCount: r.helpfulCount || 0,
      isUserAdded: r.isUserAdded,
    }));
  }
  return INITIAL_REVIEWS;
}

type TabKey = "description" | "specs" | "reviews" | "shipping" | "care";

export function ProductTabs({ product, onReviewAdded }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const { user, token } = useAuth();

  // Reviews state synced with product.reviews
  const [reviews, setReviews] = useState<UserReview[]>(() => getInitialReviews(product));
  const [selectedFilter, setSelectedFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"helpful" | "newest" | "highest">("helpful");
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: boolean }>({});

  // Write a Review Modal state
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formFit, setFormFit] = useState<"Runs Small" | "True to Size" | "Runs Large">(
    "True to Size"
  );
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formRecommend, setFormRecommend] = useState(true);

  // Sync state if product.reviews changes
  useEffect(() => {
    if (product.reviews && product.reviews.length > 0) {
      setReviews(getInitialReviews(product));
    }
  }, [product.reviews]);

  // Pre-fill user name if logged in
  useEffect(() => {
    if (user?.name && !formAuthor) {
      setFormAuthor(user.name);
    }
  }, [user, formAuthor]);

  // Toggle helpful vote with backend persistence
  const toggleHelpful = (id: string) => {
    const isCurrentlyVoted = !!helpfulVotes[id];
    setHelpfulVotes((prev) => ({ ...prev, [id]: !isCurrentlyVoted }));
    setReviews((all) =>
      all.map((r) =>
        r.id === id
          ? { ...r, helpfulCount: r.helpfulCount + (isCurrentlyVoted ? -1 : 1) }
          : r
      )
    );

    const identifier = product._id || product.id || product.slug;
    if (identifier && id && !id.startsWith("r")) {
      voteReviewHelpful(identifier, id).catch(() => {});
    }
  };

  // Submit Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formContent.trim() || !formAuthor.trim()) {
      toast.error("Please fill in your name, review headline, and details");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const identifier = product._id || product.id || product.slug;
      const res = await addProductReview(
        identifier,
        {
          rating: formRating,
          fit: formFit,
          title: formTitle.trim(),
          content: formContent.trim(),
          author: formAuthor.trim(),
          city: formCity.trim() || "India",
        },
        token
      );

      if (!res.success) {
        toast.error(res.message || "Failed to submit review");
        setIsSubmittingReview(false);
        return;
      }

      const formattedReview: UserReview = {
        id: res.review?._id?.toString() || `usr-${Date.now()}`,
        author: res.review?.author || formAuthor.trim(),
        city: res.review?.city || formCity.trim() || "India",
        date: "Just now",
        rating: res.review?.rating || formRating,
        fit: res.review?.fit || formFit,
        title: res.review?.title || formTitle.trim(),
        content: res.review?.content || formContent.trim(),
        verified: true,
        helpfulCount: 0,
        isUserAdded: true,
      };

      setReviews((prev) => [formattedReview, ...prev]);

      if (onReviewAdded) {
        onReviewAdded(formattedReview, res.ratings, res.numReviews);
      }

      setIsWriteReviewOpen(false);

      // Reset Form
      setFormTitle("");
      setFormContent("");
      setFormCity("");
      setFormRating(5);

      toast.success(res.message || "Thank you! Your verified review has been published.", {
        duration: 4000,
      });
    } catch (err: any) {
      toast.error(err.message || "Network error while saving review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered and sorted reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === "all") return true;
    return r.rating === selectedFilter;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "helpful") return b.helpfulCount - a.helpfulCount;
    if (sortBy === "highest") return b.rating - a.rating;
    return 0; // default order
  });

  const tabs: { key: TabKey; label: string; badge?: string | number }[] = [
    { key: "description", label: "Description & Story" },
    { key: "specs", label: "Tech Specifications" },
    { key: "reviews", label: "Ratings & Reviews", badge: reviews.length },
    { key: "shipping", label: "Shipping & Returns" },
    { key: "care", label: "Care & Cleaning" },
  ];

  return (
    <section className="w-full mt-14 pt-8 border-t border-[#EAEAEA] font-sans">
      {/* =========================================================
          TABS NAVIGATION HEADER (NIKE / ADIDAS ATHLETIC MINIMALIST)
          ========================================================= */}
      <div className="flex items-center gap-2 sm:gap-8 border-b border-[#EAEAEA] overflow-x-auto scrollbar-none pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-2",
                isActive
                  ? "text-[#111111]"
                  : "text-[#707072] hover:text-[#111111]"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-[#111111] text-white"
                      : "bg-[#EAEAEA] text-[#707072]"
                  )}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active bottom border indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#111111]" />
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: DESCRIPTION & STORY
          ========================================================= */}
      {activeTab === "description" && (
        <div className="py-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
                Engineered for Peak Daily Performance
              </h3>
              <p className="text-sm text-[#444444] leading-relaxed">
                {product.description} Built with meticulous engineering to support natural foot ergonomics, the {product.name} delivers effortless transitions from city commutes to intensive training sessions.
              </p>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC]">
                  <RiSparklingLine className="text-xl text-[#111111] mb-2" />
                  <h4 className="text-xs font-black uppercase text-[#111111] tracking-wider mb-1">
                    Dual Cushioning
                  </h4>
                  <p className="text-[12px] text-[#707072] leading-normal">
                    Responsive high-rebound foam softens every heel strike while propelling your forward push-off.
                  </p>
                </div>
                <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC]">
                  <RiShieldCheckLine className="text-xl text-[#111111] mb-2" />
                  <h4 className="text-xs font-black uppercase text-[#111111] tracking-wider mb-1">
                    Reinforced Upper
                  </h4>
                  <p className="text-[12px] text-[#707072] leading-normal">
                    Engineered knit mesh adapts dynamically to your foot width while preventing hot spots and moisture buildup.
                  </p>
                </div>
                <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC]">
                  <RiTruckLine className="text-xl text-[#111111] mb-2" />
                  <h4 className="text-xs font-black uppercase text-[#111111] tracking-wider mb-1">
                    All-Surface Grip
                  </h4>
                  <p className="text-[12px] text-[#707072] leading-normal">
                    Lugged carbon rubber compound delivers high traction on wet asphalt, gym tiles, and gravel paths.
                  </p>
                </div>
              </div>

              {/* Sustainability Notice */}
              <div className="mt-4 p-3.5 bg-[#F4F8F4] border border-[#D5E8D4] flex items-center gap-3 text-xs text-[#2E7D32]">
                <RiInformationLine className="text-lg shrink-0" />
                <span>
                  <strong>Eco-Conscious Build:</strong> Crafted with at least 20% recycled content by weight to reduce landfill waste and carbon footprint.
                </span>
              </div>
            </div>

            {/* Right Story Card */}
            <div className="lg:col-span-4 bg-[#F8F8F8] p-5 border border-[#ECECEC] flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#707072]">
                Key Highlights
              </span>
              <ul className="flex flex-col gap-2.5 text-xs text-[#333333]">
                {product.features?.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <RiCheckLine className="text-[#111111] text-base shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                )) || (
                  <>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="text-[#111] shrink-0" />
                      <span>Breathable lightweight construction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="text-[#111] shrink-0" />
                      <span>Durable abrasion-resistant rubber outsole</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: TECH SPECIFICATIONS
          ========================================================= */}
      {activeTab === "specs" && (
        <div className="py-8 animate-fadeIn">
          <div className="max-w-3xl">
            <h3 className="text-lg font-black uppercase tracking-tight text-[#111111] mb-4">
              Footwear Specifications & Materials
            </h3>

            <div className="border border-[#EAEAEA] divide-y divide-[#EAEAEA] text-xs">
              <div className="grid grid-cols-2 p-3.5 bg-white">
                <span className="font-bold text-[#111111]">Product Line</span>
                <span className="text-[#707072]">{product.name}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-[#FAFAFA]">
                <span className="font-bold text-[#111111]">Style Subtitle</span>
                <span className="text-[#707072]">{product.subtitle}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-white">
                <span className="font-bold text-[#111111]">Upper Material</span>
                <span className="text-[#707072]">
                  Premium Engineered Knit Mesh with Thermo-welded Overlays
                </span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-[#FAFAFA]">
                <span className="font-bold text-[#111111]">Midsole Cushioning</span>
                <span className="text-[#707072]">
                  Dual-Density Rebound EVA Foam & Heel Absorption Core
                </span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-white">
                <span className="font-bold text-[#111111]">Outsole Grip</span>
                <span className="text-[#707072]">
                  Full-length Carbon Rubber with Multi-directional Flex Grooves
                </span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-[#FAFAFA]">
                <span className="font-bold text-[#111111]">Heel-to-Toe Drop</span>
                <span className="text-[#707072]">8 mm</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-white">
                <span className="font-bold text-[#111111]">Average Weight</span>
                <span className="text-[#707072]">Approx. 280g (UK size 8)</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-[#FAFAFA]">
                <span className="font-bold text-[#111111]">Country of Origin</span>
                <span className="text-[#707072]">Vietnam / India</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: RATINGS & REVIEWS (WITH WRITE A REVIEW)
          ========================================================= */}
      {activeTab === "reviews" && (
        <div className="py-8 animate-fadeIn">
          {/* TOP SUMMARY & WRITE REVIEW BUTTON */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-4xl sm:text-5xl font-black text-[#111111]">
                  {product.rating}
                </span>
                <div className="flex items-center text-[#FA8C16] text-sm mt-1">
                  {[...Array(5)].map((_, i) => (
                    <RiStarFill
                      key={i}
                      className={i < Math.floor(product.rating) ? "text-[#FA8C16]" : "text-[#E8E8E8]"}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#707072] mt-0.5">
                  {reviews.length} Verified Customer Reviews
                </p>
              </div>

              {/* Fit Gauge */}
              <div className="hidden sm:block pl-6 border-l border-[#EAEAEA] text-xs">
                <span className="font-bold text-[#111111] block mb-1">Customer Fit Feedback</span>
                <div className="flex items-center gap-1.5 text-[#2E7D32] font-semibold">
                  <RiCheckLine className="text-base" />
                  <span>94% of buyers report True to Size</span>
                </div>
              </div>
            </div>

            {/* WRITE A REVIEW TRIGGER BUTTON */}
            <div>
              <Button
                variant="slide"
                size="compact"
                onClick={() => setIsWriteReviewOpen(true)}
                className="flex items-center gap-2 h-11 px-6 bg-[#111111] hover:bg-black text-white uppercase tracking-wider text-xs font-bold"
              >
                <RiEditLine className="text-base" />
                <span>Write a Review</span>
              </Button>
            </div>
          </div>

          {/* FILTER CHIPS & SORT DROPDOWN */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-[#111111]">Filter by:</span>
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-full border text-xs font-bold transition-colors cursor-pointer",
                  selectedFilter === "all"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#555] border-[#D0D0D0] hover:border-black"
                )}
              >
                All ({reviews.length})
              </button>
              {[5, 4, 3].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedFilter(star)}
                    className={cn(
                      "px-3 py-1 rounded-full border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                      selectedFilter === star
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#555] border-[#D0D0D0] hover:border-black"
                    )}
                  >
                    <span>{star}</span>
                    <RiStarFill className="text-[10px] text-[#FA8C16]" />
                    <span>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#707072]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-[#D0D0D0] bg-white px-2.5 py-1 text-xs font-bold text-[#111111] outline-none"
              >
                <option value="helpful">Most Helpful</option>
                <option value="highest">Highest Rating</option>
                <option value="newest">Latest First</option>
              </select>
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div className="flex flex-col divide-y divide-[#EAEAEA] pt-2">
            {sortedReviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#707072]">
                No reviews found matching this filter.
              </div>
            ) : (
              sortedReviews.map((rev) => (
                <div key={rev.id} className="py-6 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-[#FA8C16]">
                      {[...Array(5)].map((_, i) => (
                        <RiStarFill
                          key={i}
                          className={i < rev.rating ? "text-[#FA8C16]" : "text-[#E8E8E8]"}
                        />
                      ))}
                    </div>
                    <span className="text-[#999999] text-[11px]">{rev.date}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#111111] mt-1">{rev.title}</h4>

                  <div className="flex items-center gap-2 text-[11px] text-[#707072]">
                    <span className="font-semibold text-[#111111]">{rev.author}</span>
                    {rev.city && <span>• {rev.city}</span>}
                    {rev.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[#2E7D32] font-semibold bg-[#EBF5EC] px-1.5 py-0.2 rounded-xs">
                        <RiCheckLine className="text-xs" /> Verified Buyer
                      </span>
                    )}
                    <span className="text-[#999]">• Fit: {rev.fit}</span>
                  </div>

                  <p className="text-xs text-[#444444] leading-relaxed mt-1">{rev.content}</p>

                  {/* Helpful Button */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => toggleHelpful(rev.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer px-2.5 py-1 border rounded-xs",
                        helpfulVotes[rev.id]
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-[#707072] border-[#E0E0E0] hover:text-[#111] hover:border-black"
                      )}
                    >
                      {helpfulVotes[rev.id] ? <RiThumbUpFill /> : <RiThumbUpLine />}
                      <span>Helpful ({rev.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: SHIPPING & RETURNS
          ========================================================= */}
      {activeTab === "shipping" && (
        <div className="py-8 animate-fadeIn">
          <div className="max-w-3xl flex flex-col gap-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Fast Delivery & Hassle-Free Doorstep Returns
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC]">
                <RiTruckLine className="text-2xl text-[#111111] mb-2" />
                <h4 className="text-xs font-black uppercase text-[#111111] mb-1">
                  Free Express Delivery
                </h4>
                <p className="text-xs text-[#707072] leading-relaxed">
                  Complimentary tracked shipping on all prepaid and Cash-on-Delivery orders. Orders in metro cities arrive within 2–3 business days.
                </p>
              </div>

              <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC]">
                <RiRefreshLine className="text-2xl text-[#111111] mb-2" />
                <h4 className="text-xs font-black uppercase text-[#111111] mb-1">
                  7-Day Doorstep Returns
                </h4>
                <p className="text-xs text-[#707072] leading-relaxed">
                  If the size doesn’t fit or you’re not 100% satisfied, request a free doorstep exchange or instant refund within 7 days of delivery.
                </p>
              </div>
            </div>

            <div className="p-4 border border-[#EAEAEA] text-xs text-[#444444] flex flex-col gap-2">
              <strong className="text-[#111111]">Easy 3-Step Return Process:</strong>
              <ol className="list-decimal pl-4 flex flex-col gap-1 text-[#666]">
                <li>Initiate a return or size swap from your NK-SHOES account or order link.</li>
                <li>Keep the shoes unworn in their original box and tags intact.</li>
                <li>Our courier partner will inspect and collect the parcel right from your doorstep.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: CARE & MAINTENANCE
          ========================================================= */}
      {activeTab === "care" && (
        <div className="py-8 animate-fadeIn">
          <div className="max-w-2xl flex flex-col gap-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Footwear Care Guide
            </h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Keep your pair looking fresh, odor-free, and performing at its peak with these official maintenance guidelines:
            </p>

            <ul className="flex flex-col gap-3 text-xs text-[#444444]">
              <li className="flex items-start gap-2.5 p-3 bg-[#F9F9F9] border border-[#ECECEC]">
                <span className="font-black text-[#111111]">01.</span>
                <span>
                  <strong>Dry Brush Sole & Upper:</strong> Use a soft-bristled brush to remove dry mud and dust particles before cleaning with water.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 bg-[#F9F9F9] border border-[#ECECEC]">
                <span className="font-black text-[#111111]">02.</span>
                <span>
                  <strong>Gentle Hand Cleanse:</strong> Mix lukewarm water with mild liquid detergent. Clean gently with a microfibre cloth.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 bg-[#F9F9F9] border border-[#ECECEC]">
                <span className="font-black text-[#111111]">03.</span>
                <span>
                  <strong>Air Dry Naturally:</strong> Never place your shoes in a washing machine, dryer, or near direct radiators. Air dry at room temperature.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================
          WRITE A REVIEW MODAL
          ========================================================= */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        maxWidth="md"
        title="Write a Customer Review"
      >
        <form onSubmit={handleReviewSubmit} className="p-6 font-sans flex flex-col gap-4 text-xs">
          {/* 1. Overall Star Rating */}
          <div>
            <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1.5">
              Overall Score:
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setFormRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-120"
                >
                  <RiStarFill
                    className={cn(
                      "text-2xl transition-colors",
                      (hoverRating !== null ? hoverRating >= star : formRating >= star)
                        ? "text-[#FA8C16]"
                        : "text-[#D8D8D8]"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 font-bold text-xs text-[#111111]">
                {formRating === 5
                  ? "Excellent! (5/5)"
                  : formRating === 4
                  ? "Very Good (4/5)"
                  : formRating === 3
                  ? "Good (3/5)"
                  : formRating === 2
                  ? "Fair (2/5)"
                  : "Poor (1/5)"}
              </span>
            </div>
          </div>

          {/* 2. Fit Assessment */}
          <div>
            <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1.5">
              How did it fit?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Runs Small", "True to Size", "Runs Large"] as const).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => setFormFit(fit)}
                  className={cn(
                    "py-2 border text-xs font-bold transition-colors cursor-pointer",
                    formFit === fit
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#555] border-[#D0D0D0] hover:border-black"
                  )}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Review Title */}
          <div>
            <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1">
              Review Title:
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Incredibly soft cushioning for daily running"
              className="w-full border border-[#D0D0D0] focus:border-black p-2.5 outline-none text-xs"
            />
          </div>

          {/* 4. Review Body */}
          <div>
            <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1">
              Your Experience / Review:
            </label>
            <textarea
              required
              rows={4}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Tell other athletes about comfort, material quality, and real-world durability..."
              className="w-full border border-[#D0D0D0] focus:border-black p-2.5 outline-none text-xs resize-none"
            />
          </div>

          {/* 5. Author Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1">
                Your Name:
              </label>
              <input
                type="text"
                required
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full border border-[#D0D0D0] focus:border-black p-2.5 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wide mb-1">
                City / Location:
              </label>
              <input
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="e.g. Mumbai, MH"
                className="w-full border border-[#D0D0D0] focus:border-black p-2.5 outline-none text-xs"
              />
            </div>
          </div>

          {/* 6. Recommendation checkbox */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="recommend"
              checked={formRecommend}
              onChange={(e) => setFormRecommend(e.target.checked)}
              className="accent-black w-4 h-4 cursor-pointer"
            />
            <label htmlFor="recommend" className="text-xs text-[#444] cursor-pointer">
              I recommend this product to other athletes & friends
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#EAEAEA]">
            <button
              type="button"
              disabled={isSubmittingReview}
              onClick={() => setIsWriteReviewOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#707072] hover:text-black uppercase cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              variant="slide"
              size="default"
              type="submit"
              disabled={isSubmittingReview}
              className="h-11 px-8 bg-[#111111] hover:bg-black text-white uppercase tracking-wider text-xs font-bold cursor-pointer flex items-center gap-2"
            >
              {isSubmittingReview ? (
                <>
                  <RiLoader4Line className="animate-spin text-sm" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
