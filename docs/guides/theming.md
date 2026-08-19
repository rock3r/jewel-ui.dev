# Theming

Every Jewel component reads its colours, metrics and text styles from an ambient theme.
Which theme you establish decides where those values come from, and it is the one line that
differs between a plugin and a standalone app.

In a plugin you use `SwingBridgeTheme`, which reads the running IDE — see
[The Swing bridge](swing-bridge.md). This page is about the standalone theme and about
customising either.

## The standalone theme

`IntUiTheme` has two public overloads. The short one is for when the defaults are fine:

```kotlin
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme

IntUiTheme(isDark = true) {
    // your UI
}
```

`isDark` defaults to `false`, so pass it unless you want the light theme.

The long one takes a theme definition and component styling, and is what you use as soon as
you want to change anything:

```kotlin
IntUiTheme(
    theme = themeDefinition,
    styling = ComponentStyling.default(),
) {
    // your UI
}
```

Both also accept `swingCompatMode`, which adjusts text rendering so Compose text lines up
with Swing text in the same window. You want it when embedding Compose in a Swing app; the
bridge sets it for you in a plugin.

## Building a theme definition

A theme definition holds the palette, the metrics and the base text styles. Build one from
the Int UI defaults and change what you need:

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.theme.JewelTheme
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme
import org.jetbrains.jewel.intui.standalone.theme.createDefaultTextStyle
import org.jetbrains.jewel.intui.standalone.theme.createEditorTextStyle
import org.jetbrains.jewel.intui.standalone.theme.darkThemeDefinition
import org.jetbrains.jewel.intui.standalone.theme.lightThemeDefinition
import org.jetbrains.jewel.ui.ComponentStyling
import org.jetbrains.jewel.intui.standalone.theme.default

@Composable
fun MyTheme(isDark: Boolean, content: @Composable () -> Unit) {
    val textStyle = JewelTheme.createDefaultTextStyle()
    val editorStyle = JewelTheme.createEditorTextStyle()

    val themeDefinition =
        if (isDark) {
            JewelTheme.darkThemeDefinition(defaultTextStyle = textStyle, editorTextStyle = editorStyle)
        } else {
            JewelTheme.lightThemeDefinition(defaultTextStyle = textStyle, editorTextStyle = editorStyle)
        }

    IntUiTheme(theme = themeDefinition, styling = ComponentStyling.default()) {
        content()
    }
}
```

`createDefaultTextStyle()` and `createEditorTextStyle()` are extensions on `JewelTheme`
carrying the Int UI defaults — Inter for UI text, JetBrains Mono for editor text. Pass
arguments to change size, family or weight rather than constructing a `TextStyle` from
nothing, so you inherit everything you did not mean to change.

## Component styling

`ComponentStyling.default()` supplies the Int UI styling for every component. It composes,
so you layer changes on top rather than replacing the whole set. Window decoration styling
arrives the same way:

```kotlin
import org.jetbrains.jewel.intui.window.decoratedWindow
import org.jetbrains.jewel.intui.window.styling.dark
import org.jetbrains.jewel.window.styling.TitleBarStyle

ComponentStyling.default()
    .decoratedWindow(titleBarStyle = TitleBarStyle.dark())
```

`decoratedWindow` lives in the decorated-window module, not the core styling package — see
[Decorated windows](decorated-windows.md).

## How far you can take it

Nothing about Jewel requires you to look like the IDE. Colours, metrics, icons and text
styles are all values you supply; Int UI is a set of defaults, not a constraint. Starting
from `ComponentStyling.default()` and overriding the pieces you care about is the usual
path, and it keeps you current when the Int UI defaults change.

What you should not do is fight the theme from the outside — wrapping components in
modifiers that repaint them, or hardcoding colours next to themed components. The result
stops following the user's light/dark choice, which is the thing Jewel is for.

## Reading theme values

Anything in the theme is available through `JewelTheme`:

```kotlin
JewelTheme.globalColors
JewelTheme.globalMetrics
JewelTheme.defaultTextStyle
JewelTheme.isDark
```

Use those instead of literals when you draw something custom next to Jewel components. That
is what keeps your own drawing in step when the theme changes.

## Islands themes

[Islands](https://plugins.jetbrains.com/docs/intellij/supporting-islands-theme.html) is a
variant of the New UI with its own themes. Jewel reads its colour palette, but the palette
is indexed differently, and that difference is easy to miss.

Classic palettes number their colours `1, 2, 3`. Islands palettes number them
`10, 20, 30`. So the Islands equivalent of `blueOrNull(1)` is `blueOrNull(10)`, and
`redOrNull(3)` becomes `redOrNull(30)`. Use the scheme that belongs to the palette you
are reading, which `ThemeColorPalette.isIslands` tells you.

```kotlin
val palette = JewelTheme.colorPalette
val blue = if (palette.isIslands) palette.blueOrNull(10) else palette.blueOrNull(1)
```

Two more differences matter. An Islands palette is the same in light and dark, where a
classic palette is not, and semantic tokens are layered on top of it. Jewel does not
support those tokens yet, though you can read them from the Swing look and feel.

The official Islands themes currently also carry the classic palette entries, so classic
indices happen to work against them today. Do not rely on it. Third-party themes need
not do the same, and neither need future official ones.

## See also

- [The Swing bridge](swing-bridge.md) — the plugin side
- [Typography and fonts](typography.md) — text styles in detail
- [Decorated windows](decorated-windows.md) — styling the title bar
