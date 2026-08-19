# jewel-ui.dev

The landing page for [Jewel](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel),
the IntelliJ Platform's New UI implemented in Compose for Desktop.

Served as a Cloudflare Worker with static assets.

## Layout

```
public/            the built site (this is what gets served)
src/Main.dc.html   the design source, authored as a Design Component
build-site.mjs     renders src/Main.dc.html into public/
wrangler.jsonc     Worker + static asset config
```

`src/Main.dc.html` is the single source of truth for the page. It carries the
whole design in one file and exposes a `part` prop so the design canvas can show
it in slices; the build stitches all four back into one continuous page, keeps
both theme variants in the DOM so the light/dark toggle is instant, and wires up
the two real interactions.

## Build

```bash
node build-site.mjs src/Main.dc.html public
```

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
