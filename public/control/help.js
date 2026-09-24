(function attachLocalTVHelp(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LocalTVHelp = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createLocalTVHelp() {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const detectInstallPlatform = (environment = {}) => {
    const userAgent = String(environment.userAgent || '').toLowerCase();
    const platform = String(environment.platform || '').toLowerCase();
    const maxTouchPoints = Number(environment.maxTouchPoints) || 0;

    if (userAgent.includes('android')) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (platform === 'macintel' && maxTouchPoints > 1) return 'ios';
    return 'other';
  };

  const getInstallGuidance = (platform, options = {}) => {
    if (options.isStandalone) return { mode: 'installed', primaryAction: null };
    if (platform === 'android' && options.canPrompt) {
      return { mode: 'prompt', primaryAction: 'install' };
    }
    if (platform === 'ios') return { mode: 'ios-manual', primaryAction: null };
    if (platform === 'android') return { mode: 'android-manual', primaryAction: null };
    return { mode: 'platform-choice', primaryAction: null };
  };

  const resolveSwipeIndex = ({ current = 0, count = 1, deltaX = 0, width = 0 } = {}) => {
    const safeCount = Math.max(1, Math.floor(Number(count) || 1));
    const safeCurrent = clamp(Math.floor(Number(current) || 0), 0, safeCount - 1);
    const threshold = Math.max(48, Math.abs(Number(width) || 0) * 0.14);
    if (Math.abs(Number(deltaX) || 0) < threshold) return safeCurrent;
    return clamp(safeCurrent + (deltaX < 0 ? 1 : -1), 0, safeCount - 1);
  };

  return {
    detectInstallPlatform,
    getInstallGuidance,
    resolveSwipeIndex,
  };
}));
