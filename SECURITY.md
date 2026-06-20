# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security issue in LocalTV Remote, report it privately:

- **Preferred:** Open a [private security advisory](https://github.com/creationsofm7/localtv-remote/security/advisories/new)
  on GitHub (Security → Advisories → Report a vulnerability).
- **Or email:** muditpandey2077@gmail.com with the details.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected version(s)

You can expect an initial response within **5 business days**. We'll keep you
updated on remediation progress and credit you in the release notes if you wish.

## Scope

LocalTV Remote is a **LAN-only** remote control daemon. Relevant areas include:

- The pairing flow and 6-digit code derivation
- WebSocket origin checks and rate limiting
- The loopback-restricted pairing routes (`/host`, `/api/state`, `/api/quit`)
- Win32 input injection and the Core Audio host process

## Supported Versions

Only the latest released version receives security fixes.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1   | ❌        |
