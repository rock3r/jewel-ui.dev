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

Plugins declare bundled modules. The IntelliJ Platform supplies IDE styling. Maintainers
deliberately exclude that styling module from Maven Central:

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

## Raw HTML blocks are dropped by default

By default, the processor drops raw HTML blocks from the output. To keep common HTML
markup, create the processor with `parseEmbeddedHtml = true`. The processor then converts
supported tags into ordinary Markdown blocks and inlines.

```kotlin
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.markdown.processing.MarkdownProcessor

@OptIn(ExperimentalJewelApi::class)
val processor = MarkdownProcessor(parseEmbeddedHtml = true)
```

The converter supports these tags:

- Blocks: `p`, `ul`, `ol`, `li`, `h1` to `h6`, `pre`, `code` and `img`
- Inline content: `a`, `b`, `strong`, `i`, `em`, `code`, `pre`, `br` and `img`

The processor drops blocks with other tags. When a converted block has HTML attributes,
the processor wraps it in `MarkdownBlock.HtmlBlockWithAttributes`. The default renderer
applies the `align` attribute with the values `left`, `center` and `right`. To support
other attributes, override `RenderHtmlBlockWithAttributes()` in your block renderer.

The `MarkdownProcessor` constructor with `parseEmbeddedHtml` is annotated experimental.

## Live previews re-parse only what changed

For live previews, select the processor's editor preview mode. It re-parses changed
blocks after each edit and reuses unchanged blocks.

The processor compares common prefixes and suffixes in the old and new text. It
re-parses changed top-level CommonMark blocks and the block immediately before each
change. Including the preceding block handles block merges. The processor shifts source
spans for reused blocks. It reprocesses all inline content within each changed block.

Parsing operates at block level. Editing one large block still re-parses that whole
block. Documents with many unchanged blocks avoid most parsing work.

### Keeping the editor and the preview scrolled together

In an editor with a live preview, a `ScrollingSynchronizer` links the scroll positions of
the two panes. When the user scrolls either pane, the other pane scrolls to the same place
in the document.

Create the synchronizer from the preview's scroll state with `createContinuous()`. It
accepts the `LazyListState` of a `LazyMarkdown`, or the `ScrollState` of a `Markdown`. For
any other state, it returns `null`. Pass the synchronizer to `MarkdownMode.EditorPreview`.
Render the preview with a `ScrollSyncMarkdownBlockRenderer`, which reports the position of
each block to the synchronizer. Then call `syncScrolling()` with the editor's
`ScrollState`, and the editor's line positions from `sourceLineOffsets()`.

```kotlin
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.input.TextFieldState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextLayoutResult
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.foundation.theme.JewelTheme
import org.jetbrains.jewel.intui.markdown.standalone.ProvideMarkdownStyling
import org.jetbrains.jewel.intui.markdown.standalone.styling.dark
import org.jetbrains.jewel.intui.markdown.standalone.styling.light
import org.jetbrains.jewel.markdown.LazyMarkdown
import org.jetbrains.jewel.markdown.MarkdownMode
import org.jetbrains.jewel.markdown.WithMarkdownMode
import org.jetbrains.jewel.markdown.processing.MarkdownProcessor
import org.jetbrains.jewel.markdown.rendering.InlineMarkdownRenderer
import org.jetbrains.jewel.markdown.rendering.MarkdownStyling
import org.jetbrains.jewel.markdown.rendering.create
import org.jetbrains.jewel.markdown.scrolling.ScrollSyncMarkdownBlockRenderer
import org.jetbrains.jewel.markdown.scrolling.ScrollingSynchronizer
import org.jetbrains.jewel.markdown.scrolling.sourceLineOffsets
import org.jetbrains.jewel.markdown.scrolling.syncScrolling
import org.jetbrains.jewel.ui.component.TextArea

@OptIn(ExperimentalJewelApi::class)
@Composable
fun EditorWithPreview(editorState: TextFieldState) {
    val editorScrollState = rememberScrollState()
    val previewState = rememberLazyListState()
    val synchronizer = remember(previewState) {
        ScrollingSynchronizer.createContinuous(previewState)
    }
    val markdownMode = remember(synchronizer) { MarkdownMode.EditorPreview(synchronizer) }
    val processor = remember(markdownMode) { MarkdownProcessor(markdownMode = markdownMode) }

    val isDark = JewelTheme.isDark
    val styling = remember(isDark) { if (isDark) MarkdownStyling.dark() else MarkdownStyling.light() }
    val blockRenderer = remember(styling) {
        ScrollSyncMarkdownBlockRenderer(styling, emptyList(), InlineMarkdownRenderer.create(emptyList()))
    }

    var editorLayout by remember { mutableStateOf<TextLayoutResult?>(null) }
    val editorOffsetOfLine by remember {
        derivedStateOf { editorLayout?.sourceLineOffsets() ?: { _: Int -> null } }
    }
    LaunchedEffect(synchronizer) {
        synchronizer?.syncScrolling(editorScrollState) { editorOffsetOfLine }
    }

    val blocks = remember(editorState.text) {
        processor.processMarkdownDocument(editorState.text.toString())
    }

    WithMarkdownMode(markdownMode) {
        Row {
            TextArea(
                state = editorState,
                modifier = Modifier.weight(1f),
                scrollState = editorScrollState,
                onTextLayout = { getResult -> getResult()?.let { editorLayout = it } },
            )
            ProvideMarkdownStyling(
                markdownStyling = styling,
                markdownMode = markdownMode,
                markdownProcessor = processor,
                markdownBlockRenderer = blockRenderer,
            ) {
                LazyMarkdown(blocks = blocks, modifier = Modifier.weight(1f), state = previewState)
            }
        }
    }
}
```

`WithMarkdownMode()` gives the preview access to the synchronizer. The synchronizer,
`MarkdownMode.EditorPreview`, `ScrollSyncMarkdownBlockRenderer`, `syncScrolling()` and
`sourceLineOffsets()` are annotated experimental.

## Rendering your own blocks

`MarkdownBlockRenderer` draws standard blocks through composable `Render*` entry points,
including `RenderParagraph`, `RenderHeading`, and `RenderFencedCodeBlock`.
Implement `MarkdownBlockRendererExtension` for custom blocks. Return whether the
extension handles a block from `canRender(block)`. Draw supported blocks in
`RenderCustomBlock`.

## See also

- [Code highlighting](code-highlighting.md) — syntax highlighting in fenced code blocks
- [Theming](theming.md) — Markdown styling follows the ambient theme
