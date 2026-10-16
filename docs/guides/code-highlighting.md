# Code highlighting

Jewel can highlight syntax in Markdown code fences. Standalone apps use built-in
grammars and theme colours. Plugins can use the IDE's highlighting through a project-aware
styling provider.

## In a standalone app

`ProvideMarkdownStyling` supplies a default highlighter without extra setup. It selects
light or dark syntax colours to match the theme. Markdown code fences use that
highlighter.

## Adding a language

Pass additional grammars directly to the highlighter:

```kotlin
import org.jetbrains.jewel.intui.markdown.standalone.ProvideMarkdownStyling
import org.jetbrains.jewel.intui.standalone.code.highlighting.SimpleCodeHighlighter

val highlighter = SimpleCodeHighlighter(colors, additionalGrammars = myGrammars)

ProvideMarkdownStyling(codeHighlighter = highlighter) {
    // Markdown rendered here uses your grammars
}
```

The highlighter searches additional grammars first. An additional grammar therefore
overrides any built-in grammar for the same language.

## Replacing highlighting entirely

To use another engine, implement `CodeHighlighter` from
`org.jetbrains.jewel.foundation.code.highlighting`. A custom engine can supply semantic
highlighting or reuse an existing highlighter:

```kotlin
fun highlight(code: String, language: String = ""): Flow<AnnotatedString>
```

The result is a `Flow<AnnotatedString>` that can emit updated highlighting.
For example, emit again after a colour scheme change or after slower analysis completes.
The flow also supports progressive results after an initial fast pass.

Supply the implementation through `ProvideMarkdownStyling`'s `codeHighlighter` argument.

## In a plugin

The bridge uses the IDE's editor colour scheme for code blocks. Blocks follow the
editor's colours when the user changes schemes.

Choose a `ProvideMarkdownStyling` overload with a `Project` parameter:

```kotlin
import org.jetbrains.jewel.intui.markdown.bridge.ProvideMarkdownStyling

ProvideMarkdownStyling(project) {
    // code blocks highlighted with the IDE's colour scheme
}
```

The provider needs the project to access IDE highlighting. Overloads without `Project`
disable highlighting entirely. If code blocks have no syntax colours, check that you
passed a project.

## Stability

Standalone and bridge code highlighting APIs are annotated experimental. Applications
can rely on the default behaviour, but customisation API signatures can change.

## See also

- [Rendering Markdown](markdown.md) — where highlighting fits into rendering
- [Typography and fonts](typography.md) — the editor font used for code
