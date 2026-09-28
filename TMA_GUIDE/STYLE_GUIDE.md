# 📘 THE MODERN AUTHOR (TMA) — MASTER APP DESIGN SYSTEM & STYLE GUIDE

This package is the authoritative **TMA Design System** for all web applications built under **The Modern Author** suite by Melissa Forrester.

Copying this folder into any new app repository guarantees **100% brand consistency across all apps**.

---

## 🎨 1. Master Brand Color Palette

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Navy (Dark Slate)** | `#1c3447` | Navigation bar background, card containers, primary dark headers |
| **Navy Dark** | `#132432` | Textarea and input box backgrounds inside cards |
| **Gold** | `#C9A66B` | Primary gold accent, dashed stitched borders, pill badges, buttons |
| **Gold Light** | `#E6D2B0` | Hover states for gold buttons |
| **Paper Cream** | `#F7F2EA` | Main page canvas background |
| **Card Cream** | `#FAF6F0` | Report card background |
| **Ink** | `#1c3447` | Primary dark body text |
| **Line / Divider** | `#E2D7C7` | Subtle borders and section dividers |
| **Emerald Green** | `#2A7B4C` | Connected states, Go verdict, verified status |
| **Rose Red** | `#A83232` | Fatal flaw alerts & structural risks |

---

## ✒️ 2. Master Typography Rules

* **Headings (H1, H2, H3):** `Playfair Display` (Serif, Bold)
* **Body & UI Controls:** `Montserrat` (Sans-Serif, Regular/Bold)
* **Taglines & Accents:** `Great Vibes` (Script) / `Montserrat` (Uppercase Monospace Tracking)

---

## 📐 3. Header & Navigation Bar Standard

Every app MUST feature the sticky **88px Topbar** with:
1. **Left:** Square logo icon (`Modern_Author_logo.png`) + stacked `THE / MODERN / AUTHOR` uppercase text.
2. **Center:** `[APP NAME]` (White uppercase) + `[FUNCTION OF APP]` (Gold tracking).
3. **Right:** `➔] Connect Google Drive` button + Gold Badge (`FOR BEGINNERS` or custom action).

```tsx
import { TmaHeader } from "./TMA_DESIGN_SYSTEM/TmaHeader";

<TmaHeader
  appName="STORY STARTER"
  appFunction="DEVELOPMENTAL DIAGNOSTIC ENGINE"
  badgeText="FOR BEGINNERS"
  isDriveConnected={isDriveConnected}
  onConnectDrive={handleConnectDrive}
/>
```

---

## 📦 4. Navy Card with Gold Stitched Border Standard

Every main user interaction or form container MUST use the **Navy Card with Gold Stitched Border** (`#1c3447` + `2.5px dashed #C9A66B`):

```tsx
import { TmaNavyCard } from "./TMA_DESIGN_SYSTEM/TmaNavyCard";

<TmaNavyCard stepText="STEP 1 OF 4" title="What is your story idea?">
  <textarea className="answer-box-navy" placeholder="Type here..." />
  <button className="btn-primary-gold">Submit →</button>
</TmaNavyCard>
```

---

## 🚀 5. How to Copy to a New App Folder

To set up the exact same look in any new app project:

1. **Copy Logo Asset:**
   Copy `docs/TMA_DESIGN_SYSTEM/assets/Modern_Author_logo.png` to your new app's `public/Modern_Author_logo.png`.

2. **Import Stylesheet:**
   Include `docs/TMA_DESIGN_SYSTEM/tma-theme.css` in your `app/globals.css` or `layout.tsx`:
   ```css
   @import "./docs/TMA_DESIGN_SYSTEM/tma-theme.css";
   ```

3. **Use React Components:**
   Import `TmaHeader` and `TmaNavyCard` directly into your main page!

---

*Verified & Enforced for The Modern Author Application Suite.*
