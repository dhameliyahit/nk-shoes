---
name: adidas-yarn-design
description: Design system rules and guidelines based on the official Adidas YARN design system and modern athletic footwear e-commerce aesthetics. Use when building or styling components, pages, forms, and layouts for NK-SHOES.
---

# Adidas YARN Design System & Guidelines for NK-SHOES

This skill defines the visual architecture, typography, color tokens, and layout guidelines inspired by the official **Adidas YARN Design System**.

## 1. Core Principles

1. **Brutalist, Athletic Minimalism**:
   - High-contrast monochrome: Pure Black (`#000000`), Pure White (`#FFFFFF`), Athletic Grays (`#767677`, `#ECEFF1`, `#F5F5F5`).
   - Sharp rectangular architecture: `0px` border-radius (`rounded-none`). No generic rounded pill cards.
   - Zero emojis in toasts, buttons, or interface copy. Always use clean Feather/Remix/Tabler SVGs.

2. **Typography Hierarchy**:
   - **Display / Brand Headers**: `adineue PRO` / `AdihausDIN` / `Barlow Condensed`, heavy weights (700–900), uppercase, tight tracking (`tracking-tight` or `tracking-wider` on small metadata).
   - **Body & Controls**: `adineue PRO`, `Inter`, modern sans-serif (400–600).
   - **Pricing**: Bold tabular numbers.

3. **Color Tokens**:
   - `--color-black`: `#000000` / `#111111`
   - `--color-white`: `#FFFFFF`
   - `--color-gray-dark`: `#242424`
   - `--color-gray-medium`: `#767677`
   - `--color-gray-light`: `#ECEFF1`
   - `--color-gray-bg`: `#F5F5F5`
   - `--color-accent-sale`: `#C83224`

4. **Component Patterns**:
   - **Buttons**:
     - Primary: Solid `#000000` background, `#FFFFFF` text, rectangular, uppercase bold tracking, arrow hover translate.
     - Secondary / Outline: `#FFFFFF` background, `#000000` 1.5px border, black text.
   - **Product Tiles**:
     - Square (`1:1`) neutral canvas (`#F5F5F5`), `object-contain` shoe display with contact drop shadow.
   - **Cart & Checkout Architecture**:
     - Dedicated `/cart` page with left item list and right sticky order summary.
     - No cluttered drawers.
