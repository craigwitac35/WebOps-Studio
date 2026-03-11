## Cursor Cloud specific instructions

### Overview

WebOps Studio is a **zero-dependency static HTML/CSS/JS portfolio website** deployed via GitHub Pages. There is no build step, no package manager, no backend, and no database.

### Serving locally

Use `npx serve` to serve the site, as it supports **clean URLs** (e.g., `/portfolio` resolves to `portfolio.html`). Python's `http.server` will **not** work correctly because the nav links use extensionless paths (a GitHub Pages convention).

```
npx serve -l tcp://0.0.0.0:8080 --no-clipboard
```

### Linting

Run HTML validation with:

```
npx html-validate index.html about.html services.html portfolio.html gallery.html contact.html
```

There are pre-existing warnings (missing `type` attributes on `<button>` elements, etc.) that are not regressions.

### Structure

- 6 main pages: `index.html`, `about.html`, `services.html`, `portfolio.html`, `gallery.html`, `contact.html`
- 3 landing page demos under `landing-pages/` (ironshield-roofing, fitness-coach-funnel, saas-beta-waitlist)
- Shared CSS: `styles/styles.css`; shared JS: `js/scripts.js`
- External services (Formspree for contact form, MailerLite for email signup) require no local config
