# Typography and fonts

Jewel provides UI, editor, and console text styles. Derive variants from each to preserve
the user's font settings. Use editor styles for code views so they match the chosen
editor font.

## The typography API

Read the theme's text styles through `JewelTheme.typography`:

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.theme.JewelTheme
import org.jetbrains.jewel.ui.component.Text
import org.jetbrains.jewel.ui.typography

@Composable
fun Heading() {
    Text("Section", style = JewelTheme.typography.h2TextStyle)
}
```

Typography includes headings from `h0TextStyle` through `h4TextStyle`, label styling and
size, and `regular`, `medium`, and `small` variants. It also includes `editorTextStyle`
and `consoleTextStyle`.

## Deriving a style

To change font size, weight, or slant, derive from the relevant base style.
These three functions share the same signature:

```kotlin
val bigger = JewelTheme.typography.rememberDefaultTextStyle(fontSize = 15.sp)
val boldCode = JewelTheme.typography.rememberEditorTextStyle(fontWeight = FontWeight.Bold)
val quietConsole = JewelTheme.typography.rememberConsoleTextStyle(fontStyle = FontStyle.Italic)
```

Each function returns a `TextStyle` and accepts optional `fontSize`, `fontWeight`, and
`fontStyle` arguments. Unchanged properties retain their font family, features, and user
settings.

!!! note "If you are upgrading"
    Version 0.40 removed `TextStyle.copyWithSize()` and
    `org.jetbrains.jewel.ui.component.Typography`. Replace them with the three
    `remember*TextStyle` functions above. Apply other `TextStyle` properties separately
    afterward.

## Use the user's editor font

In plugins, the IDE's editor colour scheme supplies `editorTextStyle` and
`consoleTextStyle`. Code views using these styles follow the user's chosen font and
size, including later changes.

Hardcoded monospace families ignore the user's editor font choice.

## Fonts in a standalone app

Standalone apps have no IDE editor colour scheme. Jewel bundles Int UI's default fonts
in `org.jetbrains.jewel.intui.standalone`: `FontFamily.Inter` for UI text and JetBrains
Mono for editor text. Themes use these fonts unless you override their text styles.

Load other fonts through Compose Multiplatform's typography APIs:

```kotlin
import androidx.compose.ui.text.font.EmbeddedFontFamily
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.platform.asComposeFontFamily

// A font installed on the system
val system = FontFamily("My Family")

// A font embedded in the JetBrains Runtime; null when it is not there
val embedded = EmbeddedFontFamily("Embedded family") ?: FontFamily("Fallback family")

// Any java.awt.Font, including a JBFont inside the IDE
val fromAwt = myAwtFont.asComposeFontFamily()
```

Import `FontFamily(String)` and `EmbeddedFontFamily(String)` from
`androidx.compose.ui.text.font`. Import `asComposeFontFamily()` from
`androidx.compose.ui.text.platform`. Supply a fallback because `EmbeddedFontFamily`
returns null for missing families.

## Supplying your own text styles

To replace standalone typography, supply default and editor text styles when building the
theme definition. This updates components through the theme. See [Theming](theming.md).

## See also

- [Theming](theming.md) — where text styles come from
- [The Swing bridge](swing-bridge.md) — how a plugin picks up `JBFont` and the editor
  scheme
