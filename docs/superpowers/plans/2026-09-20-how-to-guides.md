# How-To Guides Implementation Plan

**Goal:** Publish ten distinct, evidence-backed "How do I" guides on GitHub Pages.

**Architecture:** Static HTML pages share docs/guides.css and link through docs/guides/index.html. Existing acquisition URLs remain intact. Only canonical public content enters the sitemap.

**Tech Stack:** HTML, CSS, JSON-LD BreadcrumbList, GitHub Pages.

## Constraints
- Use copywriting and SEO skills. No filler or unsupported compatibility/security claims.
- Remote control only; no TV or streaming positioning.
- Verify procedures against shipped controller and daemon code. Distinguish source behavior from released binaries.
- No broad firewall bypass instructions, fabricated hands-on tests, or guaranteed indexing.

## Execution
- [x] Assign five usage guides to a Sol writer and five troubleshooting guides to another with disjoint file ownership.
- [x] Add shared responsive styling and a human-readable guides index.
- [ ] Review drafts for unique value, correct UI labels and defensible claims.
- [ ] Link guides from the four existing pages and add eleven canonical URLs to sitemap.xml.
- [ ] Delegate one end-to-end local browser/SEO validation, including desktop/mobile layout, local links and sitemap coverage.
- [ ] Commit scoped files, push main, and confirm GitHub Pages deployment and public availability.
