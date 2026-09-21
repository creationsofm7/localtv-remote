# Controller Input Enhancements Design

## Goal

Improve the existing controller page for desktop and touch use with pointer lock, right and middle clicks, real left-button dragging, a safe sticky left-button mode, and direct volume-track dragging.

## Scope

This change adds only controller features and fixes. It does not copy or merge the contributor fork, add fork branding or documentation, alter installer/release automation, or change the package version.

## Architecture

The implementation stays inside the current controller PWA and reuses the existing WebSocket binary protocol. `public/control/controller.js` will own input state and encode mouse down/up frames alongside its existing move, scroll, and click frames. `public/control/index.html` will expose a compact tools row and an addressable volume track, while `public/control/controller.css` will integrate those controls without breaking the one-screen remote layout.

Pointer-lock movement and ordinary pointer-capture movement remain separate paths. A left press becomes a drag only after cumulative movement crosses the existing tap threshold; until then, release remains a click. Every path that can abandon an active press must release the host-side left button.

## Behavior

- Desktop users can capture the pointer and move the host cursor with unbounded relative `movementX` and `movementY` deltas. Escape or the active toggle releases capture.
- Physical right and middle mouse buttons send the protocol's existing click button indices. Dedicated buttons provide keyboard/touch-accessible fallbacks.
- Moving a pressed left mouse beyond the existing tap threshold sends `MOUSE_DOWN`; subsequent deltas drag, and pointer release or cancellation sends `MOUSE_UP`.
- Touch users can toggle Hold left, move with another touch, then toggle it off. Ordinary tap-clicks are suppressed while Hold left is active.
- Sticky or active left-button state is released on WebSocket loss, pointer cancellation, page lifecycle exit, and explicit toggle-off to avoid leaving the host button pressed.
- Dragging or tapping the volume track maps its horizontal position to an integer from 0 through 100 and reuses the current debounced `volume_set` channel. Existing volume buttons and long-press repeat remain unchanged.
- Pointer capture failures and unsupported or rejected pointer-lock requests are non-fatal.
- Installed PWAs receive the updated HTML, CSS, and JavaScript through a service-worker cache-key bump.

## UI

The tools row appears above the trackpad so it does not obstruct pointer movement. Hold left, Right click, and Middle click remain available on coarse touch devices; Capture pointer is hidden because touch devices have no mouse cursor to lock. Active toggle states use the controller's existing accent color and expose `aria-pressed`.

## Testing

A focused Node test will load the real controller script in a lightweight fake browser environment and exercise emitted binary frames and JSON messages. Coverage will include right/middle clicks, guarded pointer capture under lock, pointer-lock deltas, click-versus-drag behavior, cancellation cleanup, sticky-left cleanup, and volume mapping. Static checks will cover required markup, responsive visibility, accessibility state, and the service-worker cache version.

The single final end-to-end verification will be `npm test`, which builds TypeScript and executes the complete Node test suite.

## Compatibility and Constraints

- Preserve existing touch movement, one-finger tap, two-finger right-tap, two-finger scroll, wheel scroll, pointer-speed scaling, volume buttons, and reconnect behavior.
- Reuse existing protocol tags and button indices; no server or native-input changes are required.
- Do not modify or stage the user's existing network-selection work.
- Do not add browser-test dependencies unless the lightweight harness proves insufficient.
