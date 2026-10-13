# LocalTV Remote media guide

Use this guide to prepare product media and publish it manually. No publishing or scheduled task is part of the capture process.

The writing follows a simplified technical English style. Use short sentences, direct verbs, and one action per step. Use the same name for each control. See the official [ASD-STE100 Issue 9 reference](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf). This document does not claim formal ASD-STE100 compliance.

## Audience and purpose

Start with people who use a Windows PC on a shared screen. Show a task they can complete with a phone.

| Audience | Task to show | Main media |
| --- | --- | --- |
| Home media PC users | Move the pointer, adjust volume, and use supported playback keys | Remote and Media screenshots |
| People who connect a laptop to a larger display | Enter text and select an item from a distance | Remote and Keyboard screenshots |
| People who share a PC display | Pair separate phones with the same PC | Pairing sequence; future physical recording |
| New users who need setup help | Scan the PC QR code or enter the pairing code | Host and Connect screenshots |
| Contributors and reviewers | Inspect the current controller and reproduce the documentation | Source files and capture commands |

Use this product description:

> Control a Windows PC from your phone. Install LocalTV Remote on the PC. Open the controller in your phone browser. Use it as a mouse, keyboard, and volume control on a trusted local network.

State these limits when they affect the task:

- The phone does not receive a PC screen stream.
- Media buttons send keys. The active application must support those keys.
- The connection uses unencrypted HTTP and WebSocket traffic.
- The server listens on all IPv4 interfaces. A local network is the intended place of use.
- The controller can request a font from Google Fonts.
- Home Screen options depend on the phone browser. Full PWA installation can be unavailable at a local HTTP address.
- Elevated applications and some games can reject injected input.

Do not add claims about measured latency, memory use, setup time, game compatibility, or competitor features without evidence. Do not describe the product as a screen-sharing app. Do not describe the control traffic as encrypted.

## Asset inventory

Paths in this table are relative to the repository root. All eleven screenshots use the running application UI with demonstration state. The phone viewport is 390 × 844 pixels. The desktop Host viewport is 960 × 680 pixels. Both use Chrome at a device scale factor of 1.

| Asset | Source and label | Suggested alt text or caption | Reuse |
| --- | --- | --- | --- |
| `docs/assets/readme-host.png` | Production Host page with demonstration values | PC pairing page with QR code, code 123456, controller address, and network settings | README setup; connection guide; release setup sequence |
| `docs/assets/readme-connect.png` | Production pairing screen | Phone pairing screen with demonstration code 123456 and Connect button | README setup; manual pairing guide; setup post |
| `docs/assets/readme-remote.png` | Connected Remote panel with demonstration volume | Remote panel with trackpad, Hold, Right, Middle, Capture, volume, and text input | README; release overview; pointer guide; social overview |
| `docs/assets/readme-media.png` | Production Media panel | Media panel with playback and browser shortcut buttons | README; shortcut guide; media use post |
| `docs/assets/readme-keyboard.png` | Production Keyboard panel | Keyboard panel with navigation keys and directional controls | README; keyboard guide; text input post |
| `docs/assets/readme-settings.png` | Production Settings panel | Settings for pointer speed, cursor visibility, and power action | README; troubleshooting guide; settings post |
| `docs/assets/readme-help.png` | Help card 1; AI-generated hand within production UI | Help card showing one-finger movement to move the PC pointer | README; pointer guide; gesture post |
| `docs/assets/readme-drag.png` | Help card 2; AI-generated hand within production UI | Help card explaining Hold, one-finger movement, and release | README; drag guide; gesture post |
| `docs/assets/readme-scroll.png` | Help card 3; AI-generated hand within production UI | Help card showing two fingers for right-click and vertical scrolling | README; scroll guide; gesture post |
| `docs/assets/readme-install-pwa.png` | Help install card with iPhone selected | Help card with Safari and Add to Home Screen instructions | README; iPhone guide; shortcut post |
| `docs/assets/readme-install-android.png` | Help install card with Android selected | Help card with Chrome Home Screen instructions | README; Android guide; shortcut post |
| `docs/assets/readme-product.png` | AI-generated illustrative product photo | Illustrative phone beside a Windows PC, generated with AI | README introduction; release preview; social illustration |
| `docs/assets/readme-demo.gif` | Simulated demonstration of production Help CSS motion; AI-generated hands | Animated Help guide showing one-finger movement and two-finger scrolling | README; gesture guide; social preview with disclosure |
| `public/control/gestures/one-finger.png` | AI-generated transparent raster hand | Right hand with index finger extended | Production Help movement and drag cards |
| `public/control/gestures/two-fingers.png` | AI-generated transparent raster hand | Right hand with index and middle fingers extended | Production Help right-click and scroll card |

Keep the source screenshot when you crop a copy for social media. Keep the control names visible. Add text outside the screenshot if a small crop makes the UI hard to read. Do not place a new status, feature, or result inside a screenshot.

## Provenance and demonstration values

The capture uses `scripts/readme-media-server.ts`. It starts the real `DaemonControlServer` and serves `public/control`. It uses the real Host page builder and controller authentication flow.

An input sink replaces the native input, audio, and power backends. It updates demonstration state only. It does not inject mouse or keyboard input into Windows. It does not change Windows volume, put the PC to sleep, or shut down the PC.

The fixture uses these values:

| Value | Meaning |
| --- | --- |
| Pairing code `123456` | Fixed demonstration code; not a user code |
| Address `192.0.2.10` | Documentation address shown in the Host page and QR link; not a user address |
| Volume `42` | Initial demonstration level; not a measured system volume |
| Browser URL `http://127.0.0.1:6789` | Local capture URL at the default capture port |

The QR image points to the documentation address. It is not intended for real pairing. Capture the page through the loopback URL. Do not replace the demonstration values with a real pairing code, user name, or private network address.

The screenshots show product UI with a simulated connected state. They do not establish that desktop input works. The GIF shows the Help animations. It is not a recording of a physical finger or a PC pointer.

### Generated hands

The hand assets replace vector hand drawings with raster images in the Help cards. Keep the gesture paths and contact indicators from the application UI.

Detailed generation brief for `one-finger.png`:

> Create a realistic right hand with warm medium skin, with the index finger extended for a touch gesture. Use natural anatomy and proportions, visible studio skin texture, and a clean transparent background. Show the hand clearly as a separate cutout. Do not include a phone, text, symbols, jewelry, or extra fingers.

Detailed generation brief for `two-fingers.png`:

> Create a realistic right hand with warm medium skin, with the index and middle fingers extended together for a touch gesture. Use natural anatomy and proportions, visible studio skin texture, and a clean transparent background. Match the lighting, skin tone, and viewing angle of the one-finger hand. Do not include a phone, text, symbols, jewelry, or extra fingers.

These briefs describe the requested assets. They are not a guarantee of identical output from a new generation. Inspect the anatomy, transparency, orientation, and contact position before replacing a hand asset.

### Illustrative product photo

`readme-product.png` is generated media. Keep this caption next to it:

> Illustrative product photo generated with AI. The controller screenshots show the running application.

The built-in `image_gen` tool generated the photo. Its reference was `docs/assets/readme-remote.png`. Use the captured panels to show exact controls.

Final photo prompt:

> Use case: product-mockup. Make a polished realistic editorial product photograph for the open-source LocalTV Remote GitHub README. Wide landscape composition. A modern smartphone upright in portrait on a small desk stand on left foreground, screen showing EXACT supplied controller screenshot, retain the actual dark interface, labels, turquoise volume slider and tabs, no invented controls. A realistic adult human right hand reaches from bottom-right, index fingertip touching the phone trackpad naturally. On right background a desktop monitor with a generic Windows-like desktop and a simple media player window, softly out of focus, no brand logos or readable claims. Calm evening desk setting with natural soft light and warm wood surface, professional physical product photography, accurate human anatomy, five fingers, believable phone scale. No titles, slogans, watermarks, decorative arrows, extra phones, or fake metrics. Keep the controller screen authentic; this image is explicitly an AI-generated illustrative product photo.

The built-in `image_gen` tool generated both hands together on one transparent sheet. Each half was extracted, trimmed, and resized to 480 pixels high. No third-party stock images were used.

Final hand-sheet prompt:

> Use case: product-mockup. Create one photorealistic human-hand asset sheet on a truly transparent background for phone touch gesture tutorials. Two distinct isolated right hands side by side with generous empty space, both viewed obliquely from overhead, fingers pointing toward top of image, wrists entering from bottom. Left pose: index fingertip extended touching an invisible flat glass surface, other fingers naturally curled, thumb relaxed. Right pose: index and middle fingertips extended together touching an invisible flat glass surface, other fingers naturally curled, thumb relaxed. Medium warm skin tone, natural skin texture, accurate human anatomy and five fingers per hand, soft studio light, sharp realistic photographic detail, no phone, no text, no arrows, no circles, no background. Each entire hand and wrist contained in its own half without overlap. These will be used as realistic overlays on actual app screenshots.

## Reproduce the screenshots and GIF

Install the repository dependencies first. The capture also requires Playwright and Google Chrome. The GIF assembler requires Python and Pillow. Use local tools or explicit paths. The commands do not install or publish a release.

Run from the repository root:

```powershell
npm install
node scripts/capture-readme-media.cjs
python scripts/assemble-readme-gif.py
```

If Playwright or Pillow is unavailable, install it in your chosen tool environment. For example:

```powershell
npm install --no-save --package-lock=false playwright
python -m pip install Pillow
```

The capture uses installed Google Chrome. Installing Playwright alone does not supply the Chrome executable required by this script.

| Environment variable | Function |
| --- | --- |
| `README_MEDIA_PLAYWRIGHT` | Path or module specifier for the Playwright package; takes precedence over the module directory |
| `README_MEDIA_NODE_MODULES` | Directory that contains the Playwright package |
| `README_MEDIA_CHROME` | Absolute path to the Chrome executable |
| `README_MEDIA_PORT` | Capture server port; default `6789` |

If needed, set paths before you run the capture:

```powershell
$env:README_MEDIA_PLAYWRIGHT = 'C:\tools\node_modules\playwright'
$env:README_MEDIA_CHROME = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:README_MEDIA_PORT = '6789'
node scripts/capture-readme-media.cjs
python scripts/assemble-readme-gif.py
```

The script first uses explicit Playwright overrides. Without an override, it attempts normal module resolution and a bundled Codex runtime location. Use an explicit path if discovery fails.

The capture opens the Host page and the controller. It enters the fixed code, connects, opens each panel, and captures the Help cards. It writes screenshots to `docs/assets`. It writes numbered motion frames to `tmp/readme-media`.

For the GIF, the capture pauses the actual production CSS animations. It advances their time in 100 ms steps. Each step produces a browser screenshot. The movement cycle is 2.7 seconds. The scroll cycle is 3.2 seconds. The assembler adds pauses at the start and end of each cycle. The final GIF lasts 7.9 seconds.

The capture does not recreate the animation in a separate mockup. It records the Help UI animation with controlled frame times. New CSS motion can change the result. Inspect the output after a UI change.

The capture closes Chrome and stops its fixture server on completion. If capture fails, read the reported error. Check the port, module paths, and Chrome path before you repeat the command.

## Review media before use

1. Open each screenshot at its actual size.
2. Check that text and buttons are visible.
3. Check the fixed code and documentation address in the Host image.
4. Check the hand anatomy and gesture contact point.
5. Play the GIF through a full cycle.
6. Check that the GIF caption says the demonstration is simulated.
7. Keep static gesture instructions next to animated media.
8. Check that each published image has useful alt text.

This checklist is a media review. It is not an end-to-end desktop input test. Keep any test results in the change or release record.

## Distribution plan

Publish from one reviewed set of assets. Use the same control names and task instructions in each channel.

| Channel | Order and assets | Caption or message | User action |
| --- | --- | --- | --- |
| Repository README | Product illustration; Remote, Media, Keyboard; Host and Connect; gesture cards; install cards | Explain the product, then show setup and use. Label generated and simulated media. | Open the latest release or user guide |
| GitHub release | Remote overview, Host setup image, one relevant detail image | State the release change. Link to setup. Identify images made with demonstration values. | Download the matching Windows installer |
| User guides | Host and Connect for pairing; gesture cards for input; platform cards for Home Screen | Give one action per step. Place each screenshot beside the step it explains. | Complete pairing or fix the stated problem |
| Social overview | Product illustration or Remote screenshot | “Use your phone browser as a Windows mouse, keyboard, and volume control.” Label the illustration when used. | Read setup requirements |
| Social setup post | Host → Connect → Remote | “Install on the PC. Open the link on the phone. Enter the code if needed.” State that values are examples. | Follow the connection guide |
| Social gesture post | Help GIF with static drag or scroll card | “Simulated Help demonstration. Slide one finger to move. Slide two fingers to scroll.” | Open the gesture guide |

Use repository-relative image links in GitHub documents. Use the site's asset paths in user guides. Upload an image copy when a social service does not accept repository links. Retain the disclosure and useful caption with that copy.

Do not claim that a social crop proves real PC control. Do not add download counts, testimonials, or performance results that have not been measured. No posts are sent by the capture tools. A maintainer selects the destination and publishes manually.

## Future physical recording: 20–30 seconds

This recording is a roadmap item. The current GIF does not provide it. Use a physical phone and a Windows PC on the same trusted network. Capture the phone, the PC display, and the user's hand so the input result is visible.

| Time | Shot | Caption |
| --- | --- | --- |
| 0–4 s | Show the phone beside the PC. Open the pairing window. Conceal the real code and QR link in the published recording. | “Install on the Windows PC.” |
| 4–8 s | Show the phone opening the controller and connecting. Use a prepared safe cut when credentials are visible. | “Open the controller in your phone browser.” |
| 8–13 s | Slide one finger. Keep the PC pointer visible in the same shot. | “Slide one finger to move the pointer.” |
| 13–18 s | Tap Hold, move an item, then release Hold. | “Tap Hold. Move the item. Tap Hold again.” |
| 18–23 s | Slide two fingers. Show a page scrolling on the PC. | “Slide two fingers to scroll.” |
| 23–28 s | Adjust volume or enter a short phrase into a prepared field. Show the PC result. | “Change volume or enter text.” |

Use a test document and harmless desktop content. Record a real result for each shot. Do not infer response time from edited footage. Keep visible cuts and speed changes clear. Add captions that explain each action without audio.

If a shot fails, fix the setup or record it again. Do not replace the PC result with generated footage. Store the recording date, app version, browser, PC environment, and editing notes with the future source recording.

## Two-week publishing and evaluation plan

Run this plan manually. Use one audience and one main message for the first cycle. For example, test whether home media PC users can pair and move the pointer from the README instructions.

Set the evaluation rule before posting. A useful initial target is five voluntary setup reports, with at least four reporting successful pairing and pointer movement. This is a proposed target, not a product result. Count reports from people who attempted setup. Record incomplete attempts too.

| Days | Action | Record |
| --- | --- | --- |
| 1–2 | Review media and links. Prepare one overview post and one setup post. | Asset filenames, release version, channel, and final copy |
| 3–4 | Publish the overview and setup material in a relevant community that permits it. | Publication links and date |
| 5–7 | Answer voluntary feedback. Collect setup results with consent. | Windows version, browser, pairing result, first pointer action, and blockers; exclude codes and private addresses |
| 8–10 | Publish one gesture guide using the same main message. Change only the explanation that caused confusion. | The single change and reason |
| 11–12 | Ask participating testers whether they used the remote again. | Return-use reports and useful tasks |
| 13–14 | Compare results with the evaluation rule. Choose the next change. | Attempts, successful setups, repeat use, unresolved problems, and next experiment |

Keep a simple manual log. Do not add tracking code or collect pairing tokens to evaluate the media. Public download counts can give context. They do not prove successful setup or continued use.

If people cannot describe the product, revise the main message. If they understand it but cannot connect, improve the setup guide. If they connect but do not return, investigate the task and controls they needed. Use the next two-week cycle to test one change.

## Maintain the asset set

- Re-capture affected panels after a visible UI change.
- Keep screenshot filenames stable so existing guide links continue to work.
- Update the inventory if a file is removed or renamed.
- Retain generated-media labels when assets move to another channel.
- Add future physical recording notes when a real device recording is available.
- Record actual verification results separately. Do not turn a successful screenshot capture into a claim about desktop input.
