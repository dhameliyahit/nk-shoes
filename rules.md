# NK-SHOES — Project Architecture, Standards & Coding Rules

This document serves as the **single source of truth** for the **NK-SHOES** e-commerce footwear and sneaker web application. All team members and AI coding assistants must adhere strictly to these defined packages, architecture, and design rules.

---

## 1. Project Overview & Aesthetic Vision

- **Project Name:** NK-SHOES
- **Concept:** Minimalist, classic, high-performance footwear & sneaker e-commerce platform.
- **Design Inspiration:** Nike / Adidas / Salomon athletic aesthetic:
  - **Minimalist & Bold:** High-contrast monochrome palette (pure blacks `#111111`, crisp whites `#FFFFFF`, premium grays `#707072`, `#F6F6F6`), with subtle athletic accents (`#FA541C` orange or `#B91C1C` red).
  - **Typography:** Modern sans-serif typography with bold uppercase headers, tight tracking, and spacious clean body text.
  - **Clean Product Showcase:** Borderless product cards on subtle neutral gray tiles (`#F6F6F6`), hover scale transitions, and quick size pickers.
  - **Micro-Interactions:** Smooth slide-over cart drawer, smooth swiper carousel for hero drops and featured sneakers.

---

## 2. Approved Technology Stack & Fixed Packages

> [!IMPORTANT]
> **Do not install duplicate or competing packages.** Always use the approved libraries listed below:

| Purpose | Approved Package | Usage & Import Pattern | Documentation |
| :--- | :--- | :--- | :--- |
| **Framework** | `next@16.4+` | App Router (`app/` directory), Turbopack, RSC | [Next.js Docs](https://nextjs.org/docs) |
| **UI Library** | `react@19.3+` | React 19 Server & Client Components | [React Docs](https://react.dev) |
| **Styling** | `tailwindcss@^4` | Modern CSS-first engine via `@theme inline` in `globals.css` | [Tailwind v4 Docs](https://tailwindcss.com/docs) |
| **Notifications / Toast** | `react-hot-toast` | Global provider in `layout.tsx`, use `toast.success()`, `toast.error()` | [react-hot-toast Docs](https://react-hot-toast.com) |
| **Icons** | `react-icons` | Feather (`react-icons/fi`), Remix (`react-icons/ri`), Tabler (`react-icons/tb`) | [react-icons Catalog](https://react-icons.github.io/react-icons/) |
| **Carousel / Sliders** | `swiper` | `Swiper`, `SwiperSlide` from `swiper/react`, modules from `swiper/modules` | [Swiper React Docs](https://swiperjs.com/react) |
| **Class Merging** | `clsx` + `tailwind-merge` | `cn()` helper in `@/lib/utils` | [tailwind-merge](https://github.com/dcastil/tailwind-merge) |
| **Loading Spinners** | `react-spinners` | `<Loader />` from `@/components/common/loader` | [react-spinners](https://www.davidhu.io/react-spinners/) |
| **Language** | `typescript@^5` | Strict mode enabled, `@/*` path alias | [TypeScript Docs](https://www.typescriptlang.org/docs/) |

---

## 3. Reusable Global CSS Classes (`globals.css`)

All standardized design elements must reuse the utility classes defined in `app/globals.css` to keep code clean and uniform:

### 3.1. Layout Containers
- `.container-custom`: Responsive max-width container (`max-w-[1360px] mx-auto px-5 md:px-10`).

### 3.2. Button Component (`@/components/ui/button`)
The project utilizes the **NK-SHOES Button Design System** (referenced from `nk-shoes-button-playground.html`):
- `<Button variant="bag">Add to bag</Button>`: Signature Add to Bag action with subtle shine sweep, offset shadow, and bag cutout icon.
- `<Button variant="slide" arrow>Shop now</Button>`: Solid white slide fill from left.
- `<Button variant="diagonal" arrow>Explore collection</Button>`: Diagonal geometric reveal.
- `<Button variant="accent" arrow>Discover offers</Button>`: Terracotta accent sweep from bottom.
- `<Button variant="outline" arrow>View details</Button>`: Clean outline with bottom black fill.
- `<Button size="compact">Quick add</Button>`: 44px compact card button.
- Props supported: `variant`, `size`, `fullWidth`, `arrow`, `icon`, `isLoading`, `href`, `disabled`.

### 3.3. Announcement Bar (`@/components/common/announcement-bar`)
Offers, coupon codes, and promotion timers for campaigns:
- Displays promotional copy, countdown timer (`Xxd Xxh Xxm Xxs`), dashed coupon box, copy tooltip, and dismiss button (`✕`).
- Default color: Tomato red (`#FA003F`).
- Props: `badgeText`, `desktopText`, `mobileText`, `couponCode`, `targetDate`, `primaryColor`, `secondaryColor`, `dockOnMobile`, `showTimer`, `onClose`.

### 3.4. Header Component (`@/components/common/header`)
Premium customer-side athletic header (Nike & Adidas inspired):
- **Brand Typography:** Barlow Condensed, weight 900, italic (`NKSHOES`).
- **Main Navigation (Center):** Inter, weight 700, 12-13px uppercase with subtle animated underline indicator.
- **Top Utility Row (Right):** HELP | SIGN UP | LOGIN separated by subtle divider lines.
- **Action Icons (Right):** Remix Icons (`RiSearch2Line`, `RiUser3Line`, `RiHeart3Line`, `RiShoppingBag3Line`) with dynamic 0/count/99+ bag badge.
- **Mobile Navigation:** Responsive slide-out drawer (`RiMenu3Line`, `RiCloseLine`, `RiArrowRightLine`) with accessible dialog semantics and body scroll lock.
- Props: `navItems`, `utilityLinks`, `bagCount`, `wishlistCount`, `className`.

### 3.5. Typography & Color System Standards
- **Typography:**
  - Brand Logo: `Barlow Condensed`, 900, italic
  - Main Navigation: `Inter`, 700
  - Body Text: `Inter`, 400–500
  - Product Titles: `Inter`, 600–700
  - Section Headings: `Barlow Condensed`, 800–900
  - Buttons: `Inter`, 700
- **Color Palette:**
  - Main Black: `#080808`
  - Primary Text: `#111111`
  - White: `#FFFFFF`
  - Secondary Text: `#626262`
  - Muted Text: `#777777`
  - Surface: `#F6F6F6`
  - Border: `#E9E9E9`
  - Sale / Discount: `#C83224` (Hover: `#A52A20`)

### 3.5. Badges & Tags
- `.badge-tag`: Base uppercase tag styling.
- `.badge-new`: Black background, white text (`JUST IN`).
- `.badge-sale`: Red background, white text (`SALE / 20% OFF`).
- `.badge-exclusive`: Orange background, white text (`MEMBER ACCESS`).
- `.badge-muted`: Soft gray tag for subtle category labels.

### 3.4. Product Display & Cards
- `.card-product`: Clean white card with smooth hover transitions.
- `.card-product-image`: Aspect-square (`1/1`) neutral gray tile (`#f6f6f6`) with smooth image zoom on hover.

### 3.5. Forms & Inputs
- `.input-minimal`: Sleek minimal input with gray background and sharp focus ring.
- `.no-scrollbar`: Utility to hide default scrollbars on horizontal lists.

---

## 4. Swiper Slider Standard Usage

When building sneaker drop carousels or product thumbnail galleries, use `swiper/react`:

```tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

export function SneakerCarousel({ items }: { items: any[] }) {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={20}
      slidesPerView={1.2}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        1024: { slidesPerView: 3.5 },
      }}
      className="pb-10"
    >
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          {/* Card Component */}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
```

---

## 5. Toast Notification Standard Usage

Toasts are powered by `react-hot-toast` with global settings in `components/providers/toast-provider.tsx`:

```tsx
"use client";

import toast from "react-hot-toast";

// Adding item to bag
toast.success("Added to Bag • Nike Air Max 90", {
  icon: "👟",
});

// Out of stock alert
toast.error("Size selected is currently sold out");
```

---

## 6. Icons Standard Usage (`react-icons`)

Import icons directly from `react-icons`:

```tsx
import { FiShoppingBag, FiHeart, FiSearch, FiArrowRight, FiCheck } from "react-icons/fi";
import { RiFlashlightLine, RiShieldCheckLine } from "react-icons/ri";
```

---

## 7. Folder Architecture

```text
NK-SHOES/
├── rules.md                     # Single source of truth & architecture rules
└── client/
    ├── app/                     # Next.js 16 App Router
    │   ├── layout.tsx           # Root layout with ToastProvider and font config
    │   ├── page.tsx             # Homepage (Hero drops, featured sneakers, banner)
    │   ├── globals.css          # Tailwind v4, Swiper CSS, and reusable brand classes
    │   ├── products/
    │   │   ├── page.tsx         # Catalog with filter drawer (Men, Women, Lifestyle)
    │   │   └── [slug]/
    │   │       └── page.tsx     # Product Details (gallery, size selector, specs)
    │   ├── cart/                # Cart & order review
    │   └── checkout/            # Checkout flow
    ├── components/
    │   ├── ui/                  # Atomic UI elements (button, badge, drawer, modal)
    │   ├── common/              # Navbar, AnnouncementBar, Footer, SearchOverlay
    │   ├── product/             # ProductCard, ProductGrid, ProductGallery, SizeSelector
    │   ├── cart/                # CartDrawer, CartItem, OrderSummary
    │   └── providers/           # ToastProvider, etc.
    ├── hooks/                   # useCart, useFilter, useLocalStorage
    ├── lib/
    │   ├── utils.ts             # cn() class helper, formatPrice()
    │   ├── constants.ts         # Categories, shoe size chart, navigation links
    │   └── data/                # Sneaker mock catalog and seed data
    ├── types/                   # TypeScript interfaces (product.ts, cart.ts, order.ts)
    └── public/                  # Product imagery & brand assets
```

---

## 8. Coding & Naming Standards

1. **Files & Folders:** Always use `kebab-case` (`product-card.tsx`, `cart-drawer.tsx`, `use-cart.ts`).
2. **Components:** Always use `PascalCase` (`export function ProductCard()`).
3. **Server vs. Client Components:**
   - Pages and static layouts remain **Server Components** by default.
   - Use `"use client"` only for interactive leaves (state, events, toasts, swiper).
4. **Imports:** Always use `@/` path alias (e.g. `@/components/ui/button`, `@/lib/utils`).
5. **TypeScript:** Strict types only, zero `any`.
6. **Page & Section Architecture:**
   - Keep `page.tsx` clean and modular.
   - Build section components either inside dedicated folders (e.g. `components/home/sections/`) or declare sub-components at the bottom of the file and compose them cleanly in the main page export.
   - Do not dump static temporary demo code directly into page bodies.
