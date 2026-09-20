# Default Port 6776 Design

## Goal

Change LocalTV Remote's preferred server port from `3000` to `6776` to reduce conflicts with common development servers.

## Design

- Change the daemon's default port to `6776`.
- Change the reusable control server's fallback port to `6776`.
- Change the default port used by local diagnostic scripts to `6776`.
- Update README examples and configuration documentation to show `6776`.
- Preserve the `LOCALTV_REMOTE_PORT` environment override.
- Preserve automatic free-port fallback, starting at `6776` and checking subsequent ports when occupied.

## Verification

- Add a regression test that checks runtime constants, diagnostic scripts, and README references use `6776` rather than `3000`.
- Run the full test suite and TypeScript typecheck.
- Restart the app and verify it listens on port `6776`.

## Non-Goals

- Removing configurable ports.
- Removing automatic free-port selection.
- Changing the single-instance lock port.
