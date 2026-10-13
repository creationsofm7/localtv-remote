# README and product media implementation plan

**Goal:** Rewrite the README in ASD-STE100 style and show the actual controller with screenshots, realistic hands, and a simulated GIF.

**Design:** Keep installation and pairing near the start. Show each important controller panel and explain pointer movement, clicks, scrolling, and Hold. Use real browser captures for interface evidence. Label AI-generated photography and simulated animation. Remove unsupported marketing, security, memory, and compatibility claims.

**Scope:** README, documentation media, reproducible capture tooling, and replacement of the existing Help hand drawings. Preserve gesture behavior and controls.

- [x] Audit product facts against source and consult the official ASD-STE100 rules.
- [x] Run `npx ui-skills start` before changing Help artwork.
- [x] Generate transparent, anatomically realistic one-finger and two-finger hand images.
- [x] Replace Help hand paths with raster images while preserving animation and reduced-motion behavior.
- [x] Start the real HTTP/WebSocket server with an input sink for media capture. Use a public demonstration PIN and documentation-only address.
- [x] Capture pairing, Remote, Media, Keyboard, Settings, Help, and installation views in Chrome.
- [x] Create a labeled product photograph and simulated swipe/scroll GIF from real controller frames.
- [x] Rewrite README with short imperative procedures, gesture reference, limitations, troubleshooting, build instructions, and local media links.
- [x] Document asset provenance, generation prompts, reproduction commands, and a media publishing plan.
- [x] Delegate one final browser verification of pairing, Help, gestures, raster loading, reduced motion, and README media links. Delegate independent existing tests in parallel. Report raw outputs.

**Validation:** One end-to-end browser capture check; existing `npm test` in an independent subagent. No repeat runs unless a relevant file changes after the check.

## Verification record

- Existing test run: TypeScript build succeeded; 36 of 38 tests passed. The two failed files passed all 13 tests after the stale cache assertion was updated and loopback access was permitted.
- Pairing regression: reproduced two connections from one tap before the fix; all three targeted tests passed after the fix.
- Final browser verification: one effective end-to-end run exited 0, with no failures or page errors. Confirmed one authentication attempt, real controller messages received by the input sink, four Help cards, reduced motion, two mobile sizes, 17 local README references, transparent hand assets, and the 7.9-second GIF.
- Source and documentation review: approved after naming the exact loopback-only endpoints.
- Capture uses an input sink. Native Windows input and physical phone operation were not tested by this documentation workflow.
