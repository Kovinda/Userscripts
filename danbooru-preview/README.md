# Danbooru Post Preview

A lightweight, modern userscript for [Danbooru](https://danbooru.donmai.us) that lets you preview posts, images, animated GIFs, and videos directly from the grid with smooth FLIP zoom animations, keyboard navigation, and bidirectional infinite scrolling.

---

## ✨ Features

- **🚀 Instant Modal Preview:** Triggered via **Alt + Click** on any post thumbnail or by clicking the customizable **👁 preview button** overlaid on the thumbnail.
- **✨ Smooth FLIP Zoom Animation:** The clicked thumbnail lifts off from its place on the grid, smoothly expands, and settles into the modal center.
- **🎞️ Scrollable Thumbnail Filmstrip:** Horizontal rail at the bottom of the modal with side scroll arrows (`‹` / `›`), mouse wheel scrolling, and automatic active item centering.
- **🔄 Seamless Bidirectional Infinite Pagination:**
  - Navigating or scrolling forward automatically fetches the next page of posts via Danbooru's cursor API.
  - Navigating or scrolling backward automatically fetches previous/newer posts without losing scroll position.
  - All active search tags, queries, and filters are preserved.
- **⌨️ Full Keyboard Navigation:**
  - <kbd>←</kbd> (Left Arrow) — Previous post
  - <kbd>→</kbd> (Right Arrow) — Next post
  - <kbd>Esc</kbd> — Close modal
  - *Blocks Danbooru's background page pagination so you never accidentally change pages.*
- **🔊 Smart Audio / Volume Persistence:**
  - Adjusting volume or unmuting persists across posts during your browsing session.
  - Automatically resets to muted when closing the modal.
- **⚙️ Configurable Overlay Button Position:**
  - Change the 👁 button corner (`Top Right`, `Top Left`, `Bottom Right`, `Bottom Left`) directly via the Tampermonkey/Violentmonkey script menu.
- **🎯 Quality Switcher:**
  - Switch on-the-fly between `large` (720p/sample), `original` (full quality), or `progressive` (load sample first, swap to original).

---

## 📦 Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click **Install this script** on GreasyFork.
3. Visit [Danbooru](https://danbooru.donmai.us/posts) and start browsing!

---

## 📄 License

[MIT](LICENSE)
