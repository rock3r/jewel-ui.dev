# Rendering Markdown

Jewel renders Markdown as Compose UI with Jewel components. Documents share the
surrounding UI's theme, fonts, and text selection. Rendering requires no WebView, HTML
bridge, or second rendering engine in the plugin.

## Modules

The core module parses and renders CommonMark. Add separate extension artifacts for
features beyond CommonMark. Include only the extensions your content needs.

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

Plugins declare bundled modules. The IntelliJ Platform supplies IDE styling, so that
styling module has no Maven Central publication:

```kotlin
bundledModule("intellij.platform.jewel.markdown.core")
bundledModule("intellij.platform.jewel.markdown.ideLafBridgeStyling")
```

## Providing styling

Use `ProvideMarkdownStyling` from `org.jetbrains.jewel.intui.markdown.standalone` in apps.
Plugins use the `org.jetbrains.jewel.intui.markdown.bridge` variant. Bridge overloads
that accept a `Project` derive a highlighter from the IDE's code highlighting.

```kotlin
import org.jetbrains.jewel.intui.markdown.standalone.ProvideMarkdownStyling

ProvideMarkdownStyling {
    // Markdown content rendered here picks up the styling
}
```

Override the default styling, processor, block renderer, or code highlighter through
the provider's arguments.

## GitHub flavour

The extensions support tables, strikethrough, autolinks, front matter, images, and GitHub
alert blocks. The five alert kinds are **Note**, **Tip**, **Important**, **Warning**, and
**Caution**. Each uses its icon and accent colour from the current theme.

## Live previews re-parse only what changed

For live previews, select the processor's editor preview mode. It re-parses changed
blocks after each edit and reuses unchanged blocks.

The processor compares common prefixes and suffixes in the old and new text. It
re-parses changed top-level CommonMark blocks and the block immediately before each
change. Including the preceding block handles block merges. The processor shifts source
spans for reused blocks. It reprocesses all inline content within each changed block.

Parsing operates at block level. Editing one large block still re-parses that whole
block. Documents with many unchanged blocks avoid most parsing work.

## Rendering your own blocks

`MarkdownBlockRenderer` draws standard blocks through composable `Render*` entry points,
including `RenderParagraph`, `RenderHeading`, and `RenderFencedCodeBlock`.
Implement `MarkdownBlockRendererExtension` for custom blocks. Return whether the
extension handles a block from `canRender(block)`. Draw supported blocks in
`RenderCustomBlock`.

## See also

- [Code highlighting](code-highlighting.md) — syntax highlighting in fenced code blocks
- [Theming](theming.md) — Markdown styling follows the ambient theme
