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
check-links.mjs    verifies internal doc links and anchors
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
node check-links.mjs                          # must report no broken links
```

`build-docs.mjs` has no dependencies. The Markdown these pages use is small and
fixed (h1-h3, flat bullets, fenced code, admonitions, inline formatting), so a
bespoke renderer is smaller and more predictable than a parser. Its `NAV`
constant is the table of contents; the build fails if a page on disk is missing
from it, or vice versa.

The docs are not linked from the landing page yet, and carry `noindex`.

## Deploy

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler@latest deploy
```

## Screenshots

The product screenshots under `public/` are real captures of the Jewel standalone
sample running on the JetBrains Runtime, taken with
[Spectre](https://github.com/rock3r/spectre). They are not mockups. Each exists in
a light and a dark variant so the page's theme toggle swaps them with the palette.

The Jewel logo is used unmodified from the Jewel repository.
