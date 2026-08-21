# Rendering Markdown

Jewel renders Markdown with Jewel components. There is no WebView, no HTML bridge and no
second rendering engine inside your plugin. The document becomes Compose UI, so it picks
up the same theme, the same fonts and the same text selection as everything around it.

## Modules

The core module parses CommonMark and renders it. Everything beyond CommonMark is an
opt-in extension in its own artifact, so you ship only what you actually render.

```kotlin
dependencies {
    implementation("org.jetbrains.jewel:jewel-markdown-core:$jewelVersion")

    // Extensions — add only the ones you need
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-gfm-tables:$jewelVersion")
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-gfm-strikethrough:$jewelVersion")
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-gfm-alerts:$jewelVersion")
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-autolink:$jewelVersion")
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-images:$jewelVersion")
    implementation("org.jetbrains.jewel:jewel-markdown-extensions-front-matter:$jewelVersion")

    // Styling, standalone
    implementation("org.jetbrains.jewel:jewel-markdown-int-ui-standalone-styling:$jewelVersion")
}
```

In a plugin you declare bundled modules instead, and the IDE styling module comes from
the platform. It is deliberately not published to Maven Central, because in-IDE
consumers get it from the IntelliJ Platform:

```kotlin
bundledModule("intellij.platform.jewel.markdown.core")
bundledModule("intellij.platform.jewel.markdown.ideLafBridgeStyling")
```

## Providing styling

Both worlds use `ProvideMarkdownStyling`, from different packages:
`org.jetbrains.jewel.intui.markdown.standalone` for apps, and
`org.jetbrains.jewel.intui.markdown.bridge` for plugins. The bridge variant has
overloads taking a `Project`, which it uses to derive a code highlighter from the IDE's
own highlighting.

```kotlin
import org.jetbrains.jewel.intui.markdown.standalone.ProvideMarkdownStyling

ProvideMarkdownStyling {
    // Markdown content rendered here picks up the styling
}
```

Everything else is a default you can override: the styling itself, the processor, the
block renderer, and the code highlighter.

## GitHub flavour

With the extensions above, you get tables, strikethrough, autolinks, front matter,
images, and GitHub's alert blocks. The alert kinds are the five that GitHub defines —
**Note**, **Tip**, **Important**, **Warning** and **Caution** — rendered with the icon
and accent colour each one has in the current theme.

## Live previews re-parse only what changed

If you are rendering a preview next to an editor, set the processor's mode to editor
preview. It then does an incremental re-parse instead of rebuilding the document on
every keystroke.

What that means precisely, because it is easy to overstate: parsing is incremental at
**CommonMark block granularity**. On each edit the processor diffs the old and new text
by common prefix and suffix, re-parses the top-level blocks that changed — plus the
block immediately before the change, so blocks that merge are handled correctly — and
reuses the untouched blocks, shifting their source spans. Inline content inside a
changed block is re-processed in full.

So it is not character-level incremental parsing, and a change to a very large single
block still re-parses that block. For documents made of many blocks, which is most
documents, it avoids almost all of the work.

## Rendering your own blocks

`MarkdownBlockRenderer` renders the standard blocks, and every entry point on it is a
composable named `Render*` — `RenderParagraph`, `RenderHeading`, `RenderFencedCodeBlock`
and so on. To add a block type of your own, implement `MarkdownBlockRendererExtension`:
`canRender(block)` decides whether you handle a given custom block, and
`RenderCustomBlock` draws it.

## See also

- [Code highlighting](code-highlighting.md) — syntax highlighting in fenced code blocks
- [Theming](theming.md) — Markdown styling follows the ambient theme
