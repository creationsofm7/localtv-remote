# Controller Help and Visual Refinement Design

## Goal

Make the phone controller immediately understandable and visually coherent by replacing the centered LocalTV label with contextual help, teaching the real gestures through animated SVG cards, adapting PWA installation guidance to iPhone and Android, and refining the controller's shapes and volume control.

## Experience

The remote header keeps its left and right utility controls but replaces the passive centered LocalTV badge with a compact **Help** button. Activating it opens a modal bottom sheet sized for one-handed use. The sheet contains a horizontal, swipeable four-card tutorial with Back/Next controls, progress dots, an accessible close control, and drag-resistant vertical behavior so it does not conflict with page scrolling.

The cards are a real sequence:

1. **Move the pointer** — one angled finger glides across the trackpad while a subtle cursor follows.
2. **Tap, hold, and drag** — a tap ripple becomes a held contact, then an object follows the finger.
3. **Right-click and scroll** — two angled fingers tap together for right-click, then move vertically to demonstrate scrolling.
4. **Add to your Home Screen** — platform-aware PWA instructions. iPhone/iPad shows Safari Share followed by Add to Home Screen. Android uses the captured browser install prompt when available and otherwise explains Chrome menu followed by Add to Home screen. Users can switch platform instructions manually if detection is wrong.

The sheet restores focus to the Help button after closing, closes from the backdrop or Escape key, traps keyboard focus while open, and prevents the underlying trackpad from receiving gestures. Tutorial motion pauses when the sheet is hidden and respects `prefers-reduced-motion` by showing clear static end states.

## Visual Direction

The controller should feel like a small, purpose-built input device rather than a collection of web cards.

- **Base palette:** ink `#111318`, panel `#1A1D24`, raised control `#252A33`, quiet line `#343A45`, text `#F4F6F8`, cyan signal `#56D6CF`.
- **Type:** keep the existing local/application type stack to avoid a new network dependency; use weight, size, and spacing rather than decorative labels.
- **Shape system:** 12px for compact controls, 18px for grouped surfaces, and 24px for the trackpad/help sheet. Fully circular geometry is reserved for icon buttons, progress dots, and the volume knob.
- **Layout:** the trackpad remains the primary visual mass. Secondary mouse tools become a compact, even segmented row, not two rows of oversized pills. Labels stay short and sentence case.
- **Motion:** only the help sheet transition, card navigation, SVG lesson, and direct manipulation states animate. Decorative ambient motion is excluded.

The memorable element is the hand illustration: an original inline SVG constructed from smooth outlined finger forms, slightly rotated to match natural hand posture. Contact ripples, short motion trails, and small target objects explain cause and effect without relying on paragraphs of text.

## Controller Refinements

- Replace inconsistent radius values with the three-level shape system above.
- Simplify the desktop mouse tool area into one compact row with consistent height and selected states.
- Keep coarse-pointer/mobile layouts free from controls that only make sense with a physical mouse where appropriate.
- Preserve the current trackpad gesture and WebSocket behavior while making the help lesson match the implemented gestures.
- Add a visible circular thumb to the volume slider. The full slider row remains the generous hit target, and keyboard/ARIA behavior remains intact.
- Preserve safe-area padding and provide stable layouts from narrow iPhones through wider Android devices.

## Implementation Boundaries

- Use inline HTML/SVG, CSS, and the existing controller JavaScript; add no UI framework or runtime dependency.
- Keep install-prompt handling local to the controller page and never trigger installation without a user action.
- Use feature detection for `beforeinstallprompt`, standalone display mode, and iOS Safari guidance.
- Do not copy the reference fork's code or artwork.
- Do not change native server protocols except where a missing gesture mapping must be implemented to make the tutorial truthful.

## Acceptance Criteria

- The centered LocalTV text is absent and a centered Help button is present.
- Help opens a smooth four-card tutorial that supports button navigation and horizontal swiping.
- Every gesture card contains an angled finger SVG animation and accurate plain-language instructions.
- PWA guidance defaults correctly for iOS or Android and has a usable fallback when the native prompt is unavailable.
- The tutorial is usable by keyboard, restores focus, and respects reduced motion.
- Buttons, tool groups, trackpad, and volume control use a visibly consistent radius hierarchy.
- The volume slider has a visible knob that follows its value.
- Existing pointer, click, drag, scroll, navigation, media, power, and volume behavior remains intact.
