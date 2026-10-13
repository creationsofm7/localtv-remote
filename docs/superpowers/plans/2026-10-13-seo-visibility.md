# SEO visibility implementation plan

> For agentic workers: use superpowers-lite:subagent-driven-development to execute the independent tasks below.

**Goal:** Improve discovery, accuracy and setup usefulness for the existing 20 canonical pages.

**Architecture:** Keep the static GitHub Pages site and its existing visual style. Reuse production UI captures with demonstration labels; validate published HTML independently of the sitemap.

**Tech stack:** HTML, CSS, Node.js and Playwright.

## Constraints

- Preserve trailing-slash canonical URLs and the working GitHub Pages redirect.
- Do not claim screenshots prove physical PC control: existing captures use simulated backends.
- Verify competitor facts against official sources.
- Do not publish community posts or add visitor tracking without a configured destination.
- Print a note after each changed file; delegate verification.

## Tasks

- [x] Improve homepage and setup scope, contextual troubleshooting links and screenshots.
- [x] Illustrate mouse and presentation guides with existing UI captures.
- [x] Refresh both comparison pages, sources and review dates.
- [x] Repair verifier coverage for all current canonical pages and bundled browser tooling.
- [x] Update lastmod only for materially changed pages and prepare a visibility runbook with draft posts and metrics.
- [x] Review changes and run exactly one effective end-to-end command: node scripts/verify-seo-guides.cjs.

## Acceptance

All 20 pages have unique metadata, matching canonicals, reachable local links/assets and no horizontal overflow at mobile/desktop widths. Screenshots have dimensions, descriptive alt text and honest captions. Search Console follow-up remains an account action: test the slashless guides URL, validate the historical redirect error, and inspect final destination URLs.

## Verification result

2026-10-13: delegated browser verification passed, exit 0: 532 checks passed, 0 failures, 0 warnings. All 20 pages passed at mobile and desktop widths. Homepage, setup, mouse and PowerPoint captures were visually reviewed. An earlier run found comparison overflow and a local favicon probe; both were corrected before the effective final run. No deployment or Search Console account changes were performed.

