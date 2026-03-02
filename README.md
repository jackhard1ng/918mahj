# Mahj918 Website

Website for **Mahj918** — American Mahjong lessons, open play, leagues & special events in Tulsa, Oklahoma.

## Tech Stack

- React (Vite) + Tailwind CSS v4
- Google Sheets as CMS (published as CSV, fetched client-side)
- GitHub Pages hosting
- Formspree.io for contact form

## Getting Started

```bash
npm install
npm run dev
```

The site runs with demo data out of the box. To connect your Google Sheet:

1. Create a Google Sheet with tabs: **Events**, **Shop**, **Testimonials**
2. Publish each tab: File > Share > Publish to web > select tab > CSV
3. Copy `.env.example` to `.env.local` and paste the CSV URLs
4. Optionally set up a free [Formspree](https://formspree.io) form for contact submissions

## Google Sheet Column Reference

### Events Tab
Event Name | Date (MM/DD/YYYY) | Time | Venue | Address | Event Type | Price | Description | Registration Link | Max Spots | Image URL

### Shop Tab
Product Name | Category | Image URL | Buy Link | Price | Description

### Testimonials Tab
Name | Quote | Date

## Deployment

The site auto-deploys to GitHub Pages on push to `main` via GitHub Actions. To set up:

1. Go to repo Settings > Pages > Source: GitHub Actions
2. Push to `main` branch
3. For a custom domain, add a CNAME file to `public/` and configure DNS

## Project Structure

```
src/
  components/   Reusable UI components
  pages/        Route-level page components
  hooks/        Custom React hooks (Google Sheet fetching)
  utils/        CSV parser, demo data
  config.js     Sheet URLs, contact info, color mappings
```
