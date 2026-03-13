# WebOps Studio: Veteran-Built Front Ends

This repository contains the code for **WebOps Studio**, a personal portfolio site showcasing **custom, hand-coded front-end work** built by **Craig Baumann**, a U.S. Army veteran and self-taught web developer. The site is designed to be clean, fast, responsive, and simple to maintain.

## 🚀 Project Overview

The goals of this website are to:
- Showcase web design and development skills through real builds
- Present detailed project case studies
- Attract freelance clients and collaborations

**WebOps Studio** is not just a portfolio. It is a mission statement in code: precision, discipline, and a no-shortcuts build style.

## 🛠️ Technical Stack

Built from scratch with minimal dependencies and no heavy frameworks.

- **HTML5**: Semantic markup and clear structure  
- **CSS3**: Custom styling (Flexbox, Grid, CSS variables)  
- **JavaScript (Vanilla)**: Lightweight interactivity (nav, reveal animations, FAQ accordion, portfolio filters, etc.)

## 📁 Folder and File Structure

```text
WebOps-Studio/
├── index.html            # Home
├── about.html            # About
├── services.html         # Services
├── portfolio.html        # Portfolio + case study sections
├── contact.html          # Contact page + form
├── styles/
│   └── styles.css        # Main stylesheet
├── js/
│   └── scripts.js        # Main JavaScript file
└── images/               # Images, favicon, assets
```

## 🌐 URL Routing Notes

- Source files are stored as `.html` (for example `about.html`).
- Production navigation and canonical URLs use clean, extensionless paths (for example `/about`), which resolve correctly on the deployed GitHub Pages site.
- Local development should use a server that supports clean URL rewrites (such as `npx serve`).
