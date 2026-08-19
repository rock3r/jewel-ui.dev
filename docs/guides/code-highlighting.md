# Code highlighting

Fenced code blocks in rendered Markdown are syntax highlighted. Where the colours and the
grammar come from differs between a plugin and a standalone app, and in both cases the
default is already wired up.

## In a standalone app

No setup is needed. `ProvideMarkdownStyling` supplies a highlighter by default,
using light or dark syntax colours to match the theme. Render Markdown with a fenced code
block and it is highlighted.

## Adding a language

Extra grammars go to the highlighter, not through an interface of your own:

```kotlin
import org.jetbrains.jewel.intui.markdown.standalone.ProvideMarkdownStyling
import org.jetbrains.jewel.intui.standalone.code.highlighting.SimpleCodeHighlighter

val highlighter = SimpleCodeHighlighter(colors, additionalGrammars = myGrammars)

ProvideMarkdownStyling(codeHighlighter = highlighter) {
    // Markdown rendered here uses your grammars
}
```

Additional grammars are searched before the built-in ones, so supplying a grammar for a
language that is already covered overrides it rather than conflicting with it.

## Replacing highlighting entirely

If you want a different engine — because you already have one, or because you need
semantic rather than lexical highlighting — implement `CodeHighlighter` from
`org.jetbrains.jewel.foundation.code.highlighting`:

```kotlin
fun highlight(code: String, language: String = ""): Flow<AnnotatedString>
```

It returns a `Flow`, not a single value, which is the useful part: highlighting can arrive
progressively, and can be re-emitted when something changes underneath it — a colour scheme
switch, or a slower analysis completing after a fast first pass. Emit as often as you have
something better to show.

Pass your implementation as the `codeHighlighter` argument to `ProvideMarkdownStyling`.

## In a plugin

The bridge highlights code with the IDE's own editor colour scheme, so a code block in your
plugin matches the editor beside it — including when the user changes scheme.

Use a `ProvideMarkdownStyling` overload that takes a `Project`:

```kotlin
import org.jetbrains.jewel.intui.markdown.bridge.ProvideMarkdownStyling

ProvideMarkdownStyling(project) {
    // code blocks highlighted with the IDE's colour scheme
}
```

The project is what lets it reach the highlighting machinery. **The overloads that do not
take a `Project` fall back to no highlighting at all** — not to a simple built-in
highlighter. If code blocks in your plugin render unstyled, this is almost always why.

## Stability

The code highlighting APIs are annotated experimental, in both the standalone and bridge
modules. The defaults are stable enough to rely on; it is the shape of the customisation
API that may still move.

## See also

- [Rendering Markdown](markdown.md) — where highlighting fits into rendering
- [Typography and fonts](typography.md) — the editor font used for code
