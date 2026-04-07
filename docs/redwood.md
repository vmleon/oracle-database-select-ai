# Oracle Redwood Theme Reference

Extracted from the Oracle Redwood Brand Style Guide (October 2024).
Use this document to apply Redwood branding to any React or Angular application.

Source: Oracle Redwood Brand Style Guide - Brand Experience Team, October 2024.

---

## Brand Attributes

Redwood is Oracle's product and brand design system. Four core characteristics shape every interaction:

- **Human** -- warm, personal, humble
- **Sophisticated** -- modern, refined, strong
- **Aspirational** -- empowering, accessible, optimistic
- **Intelligent** -- intuitive, relevant, helpful

---

## Color

### Core Brand Colors

Oracle Red is the primary brand color. Use it for the logo, O-tag, and as an accent to build brand equity. Never as a dominant background color.

| Name             | HEX       | Usage                                   |
| ---------------- | --------- | --------------------------------------- |
| **Oracle Red**   | `#C74634` | Logo, O-tag, accent, CTA buttons        |
| **Brand Yellow** | `#F1B13F` | Secondary accent, highlights            |
| **Neutral 30**   | `#F1EFED` | Light backgrounds, primary text on dark |

### Corporate / Cross-Product / GIU Palette

| Name       | HEX       | Role                       |
| ---------- | --------- | -------------------------- |
| Neutral 30 | `#F1EFED` | Light background base      |
| Slate 150  | `#3C4545` | Dark text, dark surfaces   |
| Slate 100  | `#697778` | Secondary text on light    |
| Slate 50   | `#C2D4D4` | Borders, dividers on light |

### Product Palettes

Each Oracle product line has an assigned color palette. Use the palette matching your product area.

#### Tech, OCI, Database -- Pine

| Name             | HEX       | Role                  |
| ---------------- | --------- | --------------------- |
| Pine 170         | `#1E3224` | Darkest surface       |
| Pine 140         | `#33553C` | Dark accent           |
| Pine 100         | `#4CB25C` | Primary product color |
| Brand Yellow 170 | `#F0CC72` | Accent                |

#### ERP, EPM, SCM -- Teal

| Name      | HEX       | Role                  |
| --------- | --------- | --------------------- |
| Teal 170  | `#1E3133` | Darkest surface       |
| Teal 140  | `#315557` | Dark accent           |
| Teal 100  | `#4F707B` | Primary product color |
| Pine 90   | `#5C926D` | Secondary (ERP, EPM)  |
| Sienna 60 | `#DEB068` | Secondary (SCM)       |

#### HCM -- Rose

| Name     | HEX       | Role                  |
| -------- | --------- | --------------------- |
| Rose 170 | `#41242B` | Darkest surface       |
| Rose 130 | `#7A4753` | Dark accent           |
| Rose 100 | `#A56472` | Primary product color |
| Plum 100 | `#846A92` | Secondary             |

#### CX -- Plum

| Name     | HEX       | Role                  |
| -------- | --------- | --------------------- |
| Plum 170 | `#36293C` | Darkest surface       |
| Plum 140 | `#594564` | Dark accent           |
| Plum 100 | `#846A92` | Primary product color |
| Ocean 90 | `#558EA4` | Secondary             |

#### Health -- Sky

| Name      | HEX       | Role             |
| --------- | --------- | ---------------- |
| Sky 150   | `#06485F` | Dark surface     |
| Sky 120   | `#00688C` | Dark accent      |
| Sky 60    | `#8FBFD0` | Mid tone         |
| Sky 30    | `#E4F1F7` | Light background |
| Sienna 50 | `#99C2A6` | Secondary        |

#### NetSuite -- Ocean

| Name             | HEX       | Role             |
| ---------------- | --------- | ---------------- |
| Ocean 180        | `#1D210C` | Darkest surface  |
| Ocean 120        | `#36A71D` | Dark accent      |
| Ocean 60         | `#9AB1CE` | Mid tone         |
| Ocean 30         | `#E7E7F5` | Light background |
| Brand Yellow 160 | `#E2C0A8` | Secondary        |

### Dark Theme Derived Colors

These are not in the official guide but are practical mappings for dark-mode web applications, derived from the Redwood palette's dark tones:

| Token                 | HEX       | Derivation                                    |
| --------------------- | --------- | --------------------------------------------- |
| `--rw-bg`             | `#201C19` | Warm dark bark (from Neutral 30 dark inverse) |
| `--rw-surface`        | `#2C2723` | Elevated surface                              |
| `--rw-surface-hover`  | `#363230` | Hover / pressed surface                       |
| `--rw-border`         | `#3C3835` | Borders, dividers                             |
| `--rw-text`           | `#F1EFED` | Primary text (Neutral 30)                     |
| `--rw-text-secondary` | `#D5D0CC` | Secondary content text                        |
| `--rw-text-muted`     | `#9B9590` | Tertiary / disabled text                      |
| `--rw-text-faint`     | `#7A7470` | Timestamps, captions                          |

### Light Theme Derived Colors

| Token                 | HEX       | Derivation    |
| --------------------- | --------- | ------------- |
| `--rw-bg`             | `#F1EFED` | Neutral 30    |
| `--rw-surface`        | `#FFFFFF` | Cards, inputs |
| `--rw-surface-hover`  | `#E8E5E2` | Hover state   |
| `--rw-border`         | `#D5D0CC` | Borders       |
| `--rw-text`           | `#3C4545` | Slate 150     |
| `--rw-text-secondary` | `#697778` | Slate 100     |
| `--rw-text-muted`     | `#9B9590` | Tertiary      |

### Color Rules

- Oracle Red is an accent, never a dominant background
- Brand Yellow is an accent, never a dominant background
- Do not use gradients
- Do not use colors outside the Redwood palette
- Stick to the assigned product palette (e.g., Database = Pine)
- Always check color combinations for WCAG accessibility compliance

---

## Typography

### Primary Typeface: Oracle Sans

Oracle Sans is proprietary. For web applications without access to Oracle Sans, use this fallback stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

If Oracle Sans is available (e.g., via internal CDN):

```css
font-family:
  "Oracle Sans",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

**Weights:** Light (300), Regular (400), Semibold (600), Bold (700), Extra Bold (800)

When mixing weights, select weights with a distinct visual difference. Limit weight mixing to once per user view.

### Secondary Typeface: Georgia

Georgia is the secondary serif typeface. It complements Oracle Sans and adds warmth.

```css
font-family: Georgia, "Times New Roman", serif;
```

**Weight:** Regular only. Never bold.

**Usage:**

- Headlines, quotes, graphic callouts
- Use sparingly, never in body copy or long text blocks
- Never in numbered lists
- Never mix Georgia with Oracle Sans in a single statement or sentence

### Headline Style

- Use sentence case (capitalize only first word and proper nouns)
- No ending punctuation on headlines
- No all caps
- No drop shadows, outlines, warping, or skewing
- No tight leading
- Do not highlight multiple words or phrases

### Recommended Type Scale

| Element            | Size        | Weight   | Font          |
| ------------------ | ----------- | -------- | ------------- |
| Page title (h1)    | 1.75-2rem   | Regular  | Georgia serif |
| Section title (h2) | 1.25-1.5rem | Semibold | Sans-serif    |
| Subsection (h3)    | 1rem        | Semibold | Sans-serif    |
| Body text          | 0.9-1rem    | Regular  | Sans-serif    |
| Small / caption    | 0.8-0.85rem | Regular  | Sans-serif    |
| Button label       | 0.85-0.9rem | Semibold | Sans-serif    |

---

## Spacing

Redwood uses a consistent spacing scale. Recommended base unit: `4px` (0.25rem).

| Token            | Value            | Usage                                        |
| ---------------- | ---------------- | -------------------------------------------- |
| `--rw-space-xs`  | `0.25rem` (4px)  | Tight gaps (icon-to-text, toggle group)      |
| `--rw-space-sm`  | `0.5rem` (8px)   | Inner padding (table cells, compact buttons) |
| `--rw-space-md`  | `0.75rem` (12px) | Standard padding (inputs, cards, gaps)       |
| `--rw-space-lg`  | `1rem` (16px)    | Section margins, larger gaps                 |
| `--rw-space-xl`  | `1.5rem` (24px)  | Page padding, header spacing                 |
| `--rw-space-2xl` | `2rem` (32px)    | Major section separation                     |

---

## Border Radius

| Token            | Value  | Usage                         |
| ---------------- | ------ | ----------------------------- |
| `--rw-radius-sm` | `4px`  | Small elements (tags, chips)  |
| `--rw-radius-md` | `6px`  | Buttons, inputs, nav items    |
| `--rw-radius-lg` | `8px`  | Cards, textareas, code blocks |
| `--rw-radius-xl` | `12px` | Chat bubbles, modals          |

---

## CSS Custom Properties

Copy-paste starter for any project:

```css
:root {
  /* Brand */
  --rw-red: #c74634;
  --rw-red-hover: #b33d2e;
  --rw-yellow: #f1b13f;
  --rw-neutral: #f1efed;

  /* Product palette -- change per product line */
  --rw-product-dark: #1e3224; /* Pine 170 (Database/OCI) */
  --rw-product-mid: #33553c; /* Pine 140 */
  --rw-product-light: #4cb25c; /* Pine 100 */
  --rw-product-accent: #f0cc72; /* Brand Yellow 170 */

  /* Surfaces -- dark theme */
  --rw-bg: #201c19;
  --rw-surface: #2c2723;
  --rw-surface-hover: #363230;
  --rw-border: #3c3835;

  /* Text -- dark theme */
  --rw-text: #f1efed;
  --rw-text-secondary: #d5d0cc;
  --rw-text-muted: #9b9590;
  --rw-text-faint: #7a7470;

  /* Typography */
  --rw-font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --rw-font-serif: Georgia, "Times New Roman", serif;

  /* Spacing */
  --rw-space-xs: 0.25rem;
  --rw-space-sm: 0.5rem;
  --rw-space-md: 0.75rem;
  --rw-space-lg: 1rem;
  --rw-space-xl: 1.5rem;
  --rw-space-2xl: 2rem;

  /* Radius */
  --rw-radius-sm: 4px;
  --rw-radius-md: 6px;
  --rw-radius-lg: 8px;
  --rw-radius-xl: 12px;
}
```

### Light Theme Override

```css
[data-theme="light"],
.rw-light {
  --rw-bg: #f1efed;
  --rw-surface: #ffffff;
  --rw-surface-hover: #e8e5e2;
  --rw-border: #d5d0cc;
  --rw-text: #3c4545;
  --rw-text-secondary: #697778;
  --rw-text-muted: #9b9590;
  --rw-text-faint: #c2d4d4;
}
```

### Switching Product Palette

```css
/* ERP/EPM/SCM -- Teal */
.rw-teal {
  --rw-product-dark: #1e3133;
  --rw-product-mid: #315557;
  --rw-product-light: #4f707b;
}

/* HCM -- Rose */
.rw-rose {
  --rw-product-dark: #41242b;
  --rw-product-mid: #7a4753;
  --rw-product-light: #a56472;
}

/* CX -- Plum */
.rw-plum {
  --rw-product-dark: #36293c;
  --rw-product-mid: #594564;
  --rw-product-light: #846a92;
}
```

---

## Component Patterns

### Buttons

```css
/* Primary (Oracle Red) */
.btn-primary {
  background: var(--rw-red);
  color: #fff;
  border: none;
  border-radius: var(--rw-radius-md);
  padding: var(--rw-space-sm) var(--rw-space-xl);
  font-family: var(--rw-font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover {
  background: var(--rw-red-hover);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Secondary (outline) */
.btn-secondary {
  background: transparent;
  color: var(--rw-text-muted);
  border: 1px solid var(--rw-border);
  border-radius: var(--rw-radius-md);
  padding: var(--rw-space-sm) var(--rw-space-lg);
  font-family: var(--rw-font-sans);
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.btn-secondary:hover {
  border-color: var(--rw-text-faint);
  color: var(--rw-text);
}

/* Ghost (surface fill) */
.btn-ghost {
  background: var(--rw-surface);
  color: var(--rw-text-muted);
  border: 1px solid var(--rw-border);
  border-radius: var(--rw-radius-md);
  padding: var(--rw-space-xs) var(--rw-space-md);
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-ghost:hover {
  background: var(--rw-surface-hover);
  color: var(--rw-text);
}
```

### Text Inputs

```css
textarea,
input[type="text"],
input[type="search"] {
  font-family: var(--rw-font-sans);
  font-size: 0.95rem;
  background: var(--rw-surface);
  color: var(--rw-text);
  border: 1px solid var(--rw-border);
  border-radius: var(--rw-radius-lg);
  padding: var(--rw-space-md);
  width: 100%;
}
textarea:focus,
input:focus {
  outline: none;
  border-color: var(--rw-red);
}
```

### Cards / Containers

```css
.card {
  background: var(--rw-surface);
  border: 1px solid var(--rw-border);
  border-radius: var(--rw-radius-lg);
  padding: var(--rw-space-lg);
}
```

### Navigation

```css
nav a {
  padding: var(--rw-space-xs) var(--rw-space-lg);
  border-radius: var(--rw-radius-md);
  color: var(--rw-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition:
    background 0.15s,
    color 0.15s;
}
nav a:hover {
  background: var(--rw-surface-hover);
  color: var(--rw-text);
}
nav a.active {
  background: var(--rw-red);
  color: #fff;
}
```

### Tables

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
th,
td {
  text-align: left;
  padding: var(--rw-space-sm) var(--rw-space-md);
  border-bottom: 1px solid var(--rw-border);
}
th {
  color: var(--rw-text-muted);
  font-weight: 600;
}
```

### Header Bar

```css
header {
  display: flex;
  align-items: center;
  gap: var(--rw-space-2xl);
  padding: var(--rw-space-md) var(--rw-space-xl);
  background: var(--rw-surface);
  border-bottom: 1px solid var(--rw-border);
}
/* "Oracle" in the header should use Oracle Red */
.oracle-red {
  color: var(--rw-red);
}
```

### Chat Bubbles

```css
.bubble-user {
  background: var(--rw-red);
  color: #fff;
  border-radius: var(--rw-radius-xl);
  border-bottom-right-radius: var(--rw-radius-sm);
  padding: var(--rw-space-sm) var(--rw-space-md);
  max-width: 75%;
}
.bubble-agent {
  background: var(--rw-surface);
  border: 1px solid var(--rw-border);
  color: var(--rw-text-secondary);
  border-radius: var(--rw-radius-xl);
  border-bottom-left-radius: var(--rw-radius-sm);
  padding: var(--rw-space-sm) var(--rw-space-md);
  max-width: 75%;
}
```

---

## Logo Guidelines

- Primary logo color: Oracle Red (`#C74634`)
- On red or dark backgrounds: use white logo
- On one-color print: use black or bark
- Minimum size: 57px wide
- Clear space: equal to the cap height of the "O" on all sides
- Never recreate, stretch, rotate, or recolor the logo
- Never include the registration mark
- The O-tag goes in the bottom-right corner of the asset

---

## Things to Avoid

**Color:**

- Do not use colors outside the Redwood palette
- Do not make Oracle Red a dominant color
- Do not make yellow a dominant color
- Do not use gradients
- Do not use contrasting combinations that cause visual vibration

**Typography:**

- Do not use sans-serif typefaces other than Oracle Sans (or its fallback)
- Do not use serif typefaces other than Georgia
- Do not mix Oracle Sans and Georgia in a single statement
- Do not mix weights and sizes in a single phrase
- Do not use all caps
- Do not use tight leading
- Do not add drop shadows, outlines, or skew text
- Do not highlight multiple words or phrases in a sentence

**Logo:**

- Do not change the logo color
- Do not stretch, rotate, or redraw the logo
- Do not put the logo inside a colored shape
- Do not create your own product lockups or partner lockups
- Do not use the old logo or registration mark
