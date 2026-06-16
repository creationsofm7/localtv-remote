// Ambient declarations for optional native UI deps that ship no/loose types.
// They are loaded via dynamic import and treated as `any`, so the daemon builds
// and degrades gracefully even when these optionalDependencies aren't installed.
declare module 'webview-nodejs';
declare module 'systray2';
