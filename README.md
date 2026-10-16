# jewel-ui.dev

This repository contains the landing page and guides for
[Jewel](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel).
Jewel implements the IntelliJ Platform's New UI in Compose Multiplatform for desktop.

Cloudflare Workers serves the generated static assets.

## Layout

```
public/            the built site (this is what gets served)
src/Main.dc.html   the design source, authored as a Design Component
docs/              the user documentation, Markdown
build-site.mjs     renders src/Main.dc.html into public/
build-docs.mjs     renders docs/ into public/docs/
sync-tooling-docs.mjs  copies jewel-tooling/user-guide into docs/tooling/
sync-api-docs.mjs  builds Dokka HTML from Maven source jars into public/api/
check-links.mjs    verifies internal doc links and anchors
update-version.mjs updates the Jewel version from Maven Central
.rumdl.toml        Markdown formatting config for docs/
wrangler.jsonc     Worker + static asset config
```

Before contributing, read [AGENTS.md](AGENTS.md), [STYLE.md](STYLE.md), and
[DESIGN.md](DESIGN.md) for repository, writing, and design rules.

Edit landing page content in `src/Main.dc.html`. The build retains both theme variants
in the Document Object Model (DOM). It connects event handlers for the theme toggle and
setup popover.

## Build

```bash
rumdl fmt docs                                 # must report nothing to fix
node build-site.mjs src/Main.dc.html public   # landing page
node build-docs.mjs docs public/docs          # documentation
node sync-api-docs.mjs                         # API reference into public/api/
node check-links.mjs                          # must report no broken links
```

Generate the displayed Jewel version with `update-version.mjs`. The script reads the
published Maven Central coordinate and updates both version fields in `src/Main.dc.html`:

```bash
node update-version.mjs --dry-run   # report what would change
node update-version.mjs             # write it, then rebuild the landing page
```

The daily `.github/workflows/update-jewel-version.yml` workflow commits version updates
to `master` and deploys them. Before deployment, `verify-version-bump.mjs` substitutes the
previous version back into the generated content. The result must match the committed
file byte for byte. Any other difference stops deployment.

Commit changes to `src/Main.dc.html` together with rebuilt `public/index.html`.
Otherwise, the next version update would include unreviewed generated changes.
The verification gate detects that mismatch and blocks deployment.

`build-docs.mjs` renders a fixed Markdown subset without dependencies: h1-h3, flat bullets,
code fences, admonitions, and inline formatting. Its custom renderer keeps this limited
build small and predictable. The `NAV` constant defines the table of contents.
The build fails when the navigation and page files differ.

The landing page links to the indexed documentation. To refresh `docs/tooling/`, run
`node sync-tooling-docs.mjs` with the sibling `jewel-tooling` checkout available.
The script records the source commit in `docs/tooling/.sync-meta.json`.

## Deploy

Pushes to `master` trigger deployment through `.github/workflows/deploy.yml`.
Set the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets first.
Each run registers a GitHub Deployment for the `jewel-ui.dev` environment.
Deployment records expose only the public URL and exclude Cloudflare account IDs and tokens.

To deploy manually, run:

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler@latest deploy
```

Give GitHub Actions a **dedicated** Cloudflare API token. Keep it separate from personal
and LLM tokens. Create the token at
[dash.cloudflare.com → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
from the **Edit Cloudflare Workers** template, scoped to this account (and
optionally the `jewel-ui-dev` worker only), then store it as `CLOUDFLARE_API_TOKEN`.

## Screenshots

The screenshots in `public/` show the Jewel standalone sample running on the JetBrains
Runtime. [Spectre](https://github.com/rock3r/spectre) captured them from the running app.
Each screenshot has light and dark variants. The theme toggle switches screenshots
together with the palette.

The site uses the original Jewel repository logo without changes.
