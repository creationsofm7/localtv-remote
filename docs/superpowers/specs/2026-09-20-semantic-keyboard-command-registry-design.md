# Semantic Keyboard Command Registry Design

## Goal

Give remote-mode media controls one clean execution path: the controller sends semantic shortcut actions, and the backend resolves those actions to registered keyboard keys. This removes duplicated command-to-key mappings and keeps keyboard behavior centrally defined and testable.

## Scope

This change covers remote mode only. It applies to these media actions:

- `play_pause`
- `seek_back`
- `seek_forward`
- `fullscreen`
- `mute`
- `captions`
- `speed_up`
- `speed_down`

Existing browser navigation behavior for `go_home`, `go_back`, `go_forward`, and `reload` remains unchanged. TV mode receives no new behavior or dedicated handling.

## Architecture

### Semantic protocol

Media buttons always send a shortcut message:

```json
{ "type": "shortcut", "action": "seek_back" }
```

The browser controller does not translate semantic actions into key messages. This makes the backend the sole authority for command execution.

### Typed command registry

`src/core/main/input/shortcut-keys.ts` owns a typed registry from media shortcut actions to keyboard keys. The initial mappings are:

| Semantic action | Registered key |
| --- | --- |
| `play_pause` | `MediaPlayPause` |
| `seek_back` | `j` |
| `seek_forward` | `l` |
| `fullscreen` | `f` |
| `mute` | `m` |
| `captions` | `c` |
| `speed_up` | `>` |
| `speed_down` | `<` |

`MediaPlayPause` is preferred over the site-specific `k` shortcut because browsers can route the hardware media key through their media-session support across services such as YouTube and Netflix.

The registry is exhaustive for media actions at compile time. Browser navigation actions remain identifiable separately and are not added to the media-key registry.

### Win32 key support

The Win32 input injector registers `MediaPlayPause` with its Windows virtual-key code. It then flows through the same `injectKeyPress` path as other named keys.

## Data Flow

1. A user taps a media button on the phone controller.
2. `public/control/controller.js` sends its `data-shortcut` value as a semantic shortcut message.
3. The message parser validates the action against `SHORTCUT_ACTIONS`.
4. `SystemInputRouter` resolves media actions through the command registry.
5. The system input backend injects the registered key into Windows.

Browser navigation commands continue through their existing path and are not converted by the media registry.

## Error Handling

- Invalid shortcut names are rejected by the existing message parser.
- Actions without a registered keyboard command are ignored rather than injecting an unintended key.
- If the system input backend is unavailable, routing remains a no-op as it is today.

## Testing and Verification

- Verify every scoped media action resolves to its expected key.
- Verify browser navigation actions do not resolve through the media registry.
- Verify shortcut routing injects the resolved key once.
- Verify the browser controller no longer owns or uses a duplicate media shortcut map.
- Run TypeScript typechecking and the project build.

## Non-Goals

- Changing browser navigation behavior.
- Designing per-site shortcut profiles.
- Adding user-configurable key bindings.
- Refactoring volume, power, mouse, or text-input commands.
