# Visibility and indexing follow-up

Prepared 2026-10-13. Improve the existing pages before expanding the page count. This is an execution checklist and draft material; nothing below has been published or scheduled.

## Search Console: first actions

1. In the existing property, confirm `https://creationsofm7.github.io/localtv-remote/sitemap.xml` is submitted successfully and review its last read date. The sitemap currently lists 20 canonical URLs.
2. Inspect `https://creationsofm7.github.io/localtv-remote/guides` and run Test live URL. It should redirect once to `/localtv-remote/guides/`. The historical error was reported from an October 7 crawl; a normal redirect exclusion and a redirect error are different statuses.
3. If Google's live test succeeds, use Validate fix on the Redirect error report. If it fails, retain the live-test details before changing the site.
4. Inspect the final `/guides/` URL and three missing guides individually. Record whether each is unknown, discovered, crawled but not indexed, blocked or a duplicate. Request indexing for eligible priority pages when appropriate; do not repeatedly resubmit the same URL.
5. Check sitemap URLs and internal links use the final canonical trailing-slash addresses. Update lastmod only after a significant page update.

Google references: [redirect and indexing statuses](https://support.google.com/webmasters/answer/7440203), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Four-week work schedule

| Period | Work | Evidence to retain |
| --- | --- | --- |
| Week 1 | Deploy the reviewed site edits; run the Search Console checks above. | Live-test results, sitemap last read, status for each priority URL. |
| Week 2 | Record real phone-to-PC control for a PC connected to a TV and a PowerPoint presentation. | Original recordings and tested app/OS versions. |
| Week 3 | Publish the two demonstrations where community rules permit project sharing; disclose that you built the product. | Post URL, destination guide, referral tag and comments. |
| Week 4 | Compare impressions, clicks and download interest against the starting baseline. Improve pages that earn impressions but few clicks. | Search Console export and channel results. |

Candidate acquisition topics: free Windows phone remote, phone as a mouse without a phone app, PC volume control from a phone, PowerPoint phone remote, and alternatives to Unified Remote and Remote Mouse. These are hypotheses, not verified search-volume estimates. Use actual Search Console queries to choose what to improve next.

## Recording brief: PC connected to a TV

Show the real Windows PC connected to a display and the phone beside it. Record pairing, a cursor movement, a click and a volume change. Keep the PC display visible so the result can be seen. Explain that both devices use the same trusted local network and there is no PC-screen stream on the phone. Use the current pairing address; hide real pairing codes and personal information in the published recording. Do not use the existing simulated GIF as proof of physical control.

Draft post, to publish only after making the recording:

> I built LocalTV Remote for the times my Windows PC is connected to a TV and the keyboard is across the room. It runs on the PC; the phone opens a browser controller with a trackpad, keyboard and volume slider. It's free and open source, with no phone app or account. Both devices need to reach each other on a trusted local network. It doesn't mirror the PC screen or connect over the internet. Here's a recording of the setup and controls. I'd like feedback on the pairing steps and anything that is unclear.

Destination: `https://creationsofm7.github.io/localtv-remote/control-pc-from-phone/?utm_source=community&utm_medium=referral&utm_campaign=tv_demo`.

## Recording brief: PowerPoint

Start a real PowerPoint slideshow, keep it focused and record the phone's Input controls beside the PC display. Show next, previous and ending the slideshow. Show the difference between advancing an animation and advancing a slide. Explain that the phone sends Windows keys; it does not show notes or slide thumbnails.

Draft post, to publish only after making the recording:

> I added a guide for advancing a Windows PowerPoint slideshow from a phone browser using LocalTV Remote. Start the slideshow on the PC, pair the phone on the same local network, then use the Input panel's arrow keys. The slideshow must have focus. There are no slide thumbnails or speaker notes on the phone. The tool is free and open source; this recording shows the controls in use. I'd welcome feedback on whether the setup is clear.

Destination: `https://creationsofm7.github.io/localtv-remote/how-do-i-control-powerpoint-slides-from-my-phone/?utm_source=community&utm_medium=referral&utm_campaign=presentation_demo`.

## Weekly measurement

Take an initial Search Console export before publishing. Compare equal-length periods using the same filters, and distinguish branded queries (LocalTV/LocalTV Remote) from non-brand queries. Track by landing page:

- Index status for setup, guides, mouse, volume, PowerPoint and comparison pages.
- Non-brand impressions, clicks and click-through rate, with query and page breakdowns.
- Referral visits by campaign, if a configured analytics provider is available.
- Download-link clicks as intent, not completed downloads or active users. With a chosen analytics provider, use a `download_click` event with landing page, link destination and campaign; never include a pairing code or local PC address.
- Qualitative setup feedback and repeat use reported voluntarily by users.

No analytics provider or visitor tracking was added. UTM tags require a reporting destination to measure visits; Search Console does not report download clicks or community referral traffic. GitHub release download counts can show aggregate downloads but do not attribute them to a page or campaign.

Run distribution experiments for two weeks at a time. Keep a channel when it brings relevant visitors and useful setup feedback; revise the message or channel when it does not. SEO indexing and ranking can take longer than the experiment window. Do not assume a fixed indexing deadline or a guaranteed ranking improvement.
