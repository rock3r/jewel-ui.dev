# jewel-ui.dev

The landing page for [Jewel](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel),
the IntelliJ Platform's New UI implemented in Compose Multiplatform for desktop.

Served as a Cloudflare Worker with static assets.

## Layout

```
public/            the built site (this is what gets served)
src/Main.dc.html   the design source, authored as a Design Component
docs/              the user documentation, Markdown
build-site.mjs     renders src/Main.dc.html into public/
build-docs.mjs     renders docs/ into public/docs/
sync-tooling-docs.mjs  copies jewel-tooling/user-guide into docs/tooling/
sync-api-docs.mjs      pulls Jewel Dokka (Maven -javadoc.jar) into public/api/
check-links.mjs    verifies internal doc links and anchors
update-version.mjs updates the Jewel version from Maven Central
.rumdl.toml        Markdown formatting config for docs/
wrangler.jsonc     Worker + static asset config
```

Contributors and agents should read [AGENTS.md](AGENTS.md), which points at the
writing style guide ([STYLE.md](STYLE.md)) and the design language
([DESIGN.md](DESIGN.md)).

`src/Main.dc.html` is the single source of truth for the page. The build keeps
both theme variants in the DOM so the light/dark toggle is instant, and wires up
the two real interactions (the theme toggle and the setup popover).

## Build

```bash
rumdl fmt docs                                 # must report nothing to fix
node build-site.mjs src/Main.dc.html public   # landing page
node build-docs.mjs docs public/docs          # documentation
node sync-api-docs.mjs                         # API reference into public/api/
node check-links.mjs                          # must report no broken links
```

The Jewel version shown on the page is not typed in by hand. `update-version.mjs` reads
the published coordinate from Maven Central and writes both fields into
`src/Main.dc.html`:

```bash
node update-version.mjs --dry-run   # report what would change
node update-version.mjs             # write it, then rebuild the landing page
```

`.github/workflows/update-jewel-version.yml` runs this daily, commits the bump to `master`
and deploys it. Because that deploy is unattended, it is gated on `verify-version-bump.mjs`:
the new version is substituted back to the old, and the result must equal the committed file
byte for byte. Anything else in the diff stops the deploy.

That gate means a change to `src/Main.dc.html` must be committed together with the rebuilt
`public/index.html`. Otherwise the next bump's rebuild would sweep the change into a deploy
nobody reviewed, and the proof fails instead.

`build-docs.mjs` has no dependencies. The Markdown these pages use is small and
fixed (h1-h3, flat bullets, fenced code, admonitions, inline formatting), so a
bespoke renderer is smaller and more predictable than a parser. Its `NAV`
constant is the table of contents; the build fails if a page on disk is missing
from it, or vice versa.

Docs are linked from the landing page and are indexed. The Jewel Tooling
user guide lives under `docs/tooling/`; refresh it with
`node sync-tooling-docs.mjs` when the sibling `jewel-tooling` repo is present
(the script records the synced commit in `docs/tooling/.sync-meta.json`).

## Deploy

Pushes to `master` deploy automatically via `.github/workflows/deploy.yml`
(needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets).

Manual:

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler@latest deploy
```

Prefer a **dedicated** Cloudflare API token for GitHub Actions (not a personal
or LLM token). Create one at
[dash.cloudflare.com → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
from the **Edit Cloudflare Workers** template, scoped to this account (and
optionally the `jewel-ui-dev` worker only), then store it as `CLOUDFLARE_API_TOKEN`.

## Screenshots

The product screenshots under `public/` are real captures of the Jewel standalone
sample running on the JetBrains Runtime, taken with
[Spectre](https://github.com/rock3r/spectre). They are not mockups. Each exists in
a light and a dark variant so the page's theme toggle swaps them with the palette.

The Jewel logo is used unmodified from the Jewel repository.
