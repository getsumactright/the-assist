# The Assist — website

The live site for The Assist, Marcus Ervin's personal styling service, built from design demo 10 (The Upgrade). It is a single static page with no build step: `index.html`, plus `privacy.html` and `404.html`, with everything else under `assets/`.

Hosted on GitHub Pages from `main` (repo root). Preview URL: https://getsumactright.github.io/the-assist/

## Before launch

1. **Connect the form.** Submissions go to Marcus's inbox through [Web3Forms](https://web3forms.com). Marcus (or whoever owns the inbox) enters his email address there and receives an access key. In `index.html`, replace `YOUR_WEB3FORMS_ACCESS_KEY` with that key. Until then, the form validates normally but tells the visitor it isn't connected yet and points them to Instagram and LinkedIn.
2. **Point his domain here.** When Marcus moves themarcuservin.com off Wix:
   - Add a `CNAME` file containing `themarcuservin.com` and set the custom domain in the repo's Pages settings.
   - Set the DNS records GitHub lists for an apex domain at his registrar.
   - Replace `https://getsumactright.github.io/the-assist/` with `https://themarcuservin.com/` in `index.html` (canonical, Open Graph, JSON-LD), `privacy.html`, `robots.txt` and `sitemap.xml`.
   - In `404.html`, change `/the-assist/` to `/`.
3. **Have Marcus review the wording.** The hero line, "Find your play", the lookbook captions and the privacy policy were written for this site. Everything else comes from his current site.

## Assets

- Photos are Marcus's own, from his current site, re-encoded to WebP at 800px and 1600px.
- The two cutouts of Marcus were made on-device with Apple Vision (`../tools/cutout.swift`); they are not AI-generated.
- The dribble loop in the booking section was generated with Kling 3.0 on Higgsfield from the suited-man brand artwork, then cut and looped; see `../assets/animation/moves/generation-record.json`.
- The font is Host Grotesk, self-hosted (SIL Open Font License, `assets/fonts/OFL.txt`).
