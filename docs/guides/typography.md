# Typography and fonts

Jewel exposes the three text styles the IDE distinguishes — the UI font, the editor font
and the console font — and lets you derive variants of each. That distinction matters: a
code view that uses the UI font looks wrong, and a code view that guesses at a monospace
font ignores what the user actually chose.

## The typography API

`JewelTheme.typography` is the entry point.

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

It defines the heading scale (`h0TextStyle` through `h4TextStyle`), the label style and
its size, the `regular`, `medium` and `small` variants, and `editorTextStyle` and
`consoleTextStyle`.

## Deriving a style

To change size, weight or slant, derive rather than copy. Three functions, one per base
style, with the same signature:

```kotlin
val bigger = JewelTheme.typography.rememberDefaultTextStyle(fontSize = 15.sp)
val boldCode = JewelTheme.typography.rememberEditorTextStyle(fontWeight = FontWeight.Bold)
val quietConsole = JewelTheme.typography.rememberConsoleTextStyle(fontStyle = FontStyle.Italic)
```

Each takes `fontSize`, `fontWeight` and `fontStyle`, all optional, and returns a
`TextStyle`. Deriving keeps everything else intact: the family, the font features, and
the user's own settings.

!!! note "If you are upgrading"
    `TextStyle.copyWithSize()` and the old `org.jetbrains.jewel.ui.component.Typography`
    object were removed in 0.40. The three `remember*TextStyle` functions above replace
    both. Apply any unrelated `TextStyle` properties separately afterwards.

## The editor font is not a guess

In a plugin, `editorTextStyle` and `consoleTextStyle` come from the IDE's editor colour
scheme. If the user set their editor to a particular font at a particular size, a code
view in your plugin uses it, and follows them when they change it.

A hardcoded monospace family is visibly not the editor font.

## Fonts in a standalone app

Outside the IDE there is no editor colour scheme, so Jewel ships the families Int UI
expects and uses them as defaults: `FontFamily.Inter` for UI text and JetBrains Mono for
editor text, in `org.jetbrains.jewel.intui.standalone`. Unless you override the theme's
text styles, you get them without doing anything.

For anything else, use **Compose Multiplatform's typography APIs, not Jewel's**. The
README blurs this distinction. It matters because it tells you where to look when
something misbehaves:

```kotlin
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.platform.asComposeFontFamily

// A font installed on the system
val system = FontFamily("My Family")

// A font embedded in the JetBrains Runtime; null when it is not there
val embedded = EmbeddedFontFamily("Embedded family") ?: FontFamily("Fallback family")

// Any java.awt.Font, including a JBFont inside the IDE
val fromAwt = myAwtFont.asComposeFontFamily()
```

`FontFamily(String)` and `EmbeddedFontFamily(String)` are in
`androidx.compose.ui.text.font`. `asComposeFontFamily()` is in
`androidx.compose.ui.text.platform`. `EmbeddedFontFamily` returns null when the family
is absent, so always supply a fallback.

## Supplying your own text styles

The standalone theme builds its definition from a default and an editor text style, so
overriding typography wholesale means supplying those when you construct the theme
rather than restyling components one at a time. See [Theming](theming.md).

## See also

- [Theming](theming.md) — where text styles come from
- [The Swing bridge](swing-bridge.md) — how a plugin picks up `JBFont` and the editor
  scheme
