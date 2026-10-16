# Theming

Jewel components read colours, metrics, and text styles from the ambient theme.
Select a theme wrapper to choose where those values come from.

Plugins use `SwingBridgeTheme` to read the running IDE. See [The Swing
bridge](swing-bridge.md) for plugin details. This page covers standalone themes and
customisation shared by both environments.

## The standalone theme

Use the shorter of `IntUiTheme`'s two public overloads for default styling:

```kotlin
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme

IntUiTheme(isDark = true) {
    // your UI
}
```

The default `isDark = false` selects light styling. Pass `true` for dark styling.

For custom styling, use the overload accepting a theme definition and component styling:

```kotlin
import org.jetbrains.jewel.foundation.theme.ComponentStyling
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme
import org.jetbrains.jewel.intui.standalone.theme.default

IntUiTheme(
    theme = themeDefinition,
    styling = ComponentStyling.default(),
) {
    // your UI
}
```

Both overloads accept `swingCompatMode` to align Compose text with Swing text.
Enable it when embedding Compose in a Swing application. In plugins, the bridge enables
it automatically.

## Building a theme definition

Theme definitions contain palettes, metrics, and base text styles. Start with Int UI
defaults and override the required values:

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

The `JewelTheme` extensions `createDefaultTextStyle()` and `createEditorTextStyle()`
provide Int UI defaults. They use Inter for UI text and JetBrains Mono for editor text.
Pass size, family, or weight arguments to preserve the remaining defaults.

## Component styling

`ComponentStyling.default()` provides Int UI styles for all components.
Combine it with selective overrides to preserve unchanged defaults.
Window decoration uses the same approach:

```kotlin
import org.jetbrains.jewel.foundation.theme.ComponentStyling
import org.jetbrains.jewel.intui.standalone.theme.default
import org.jetbrains.jewel.intui.window.decoratedWindow
import org.jetbrains.jewel.intui.window.styling.dark
import org.jetbrains.jewel.window.styling.TitleBarStyle

ComponentStyling.default()
    .decoratedWindow(titleBarStyle = TitleBarStyle.dark())
```

Import `decoratedWindow` from the decorated-window module. See [Decorated
windows](decorated-windows.md) for setup.

## How far you can take it

Custom themes can supply colours, metrics, icons, and text styles.
Start with `ComponentStyling.default()` and override specific values.
Unchanged values then follow updates to Int UI defaults.

Avoid modifiers that repaint components and hardcoded colours beside themed components.
Those values do not follow the user's light or dark choice.

## Reading theme values

Read current theme values through `JewelTheme`:

```kotlin
JewelTheme.globalColors
JewelTheme.globalMetrics
JewelTheme.defaultTextStyle
JewelTheme.isDark
```

Use these values for custom drawing beside Jewel components. Your drawing then follows
theme changes with the surrounding components.

## Islands themes

[Islands](https://plugins.jetbrains.com/docs/intellij/supporting-islands-theme.html) is
a New UI variant with its own themes. Jewel reads Islands palettes using a different
index scheme from classic palettes.

Classic palettes use colour indices `1, 2, 3`. Islands uses `10, 20, 30`.
For Islands, replace `blueOrNull(1)` with `blueOrNull(10)` and `redOrNull(3)` with
`redOrNull(30)`. Check `ThemeColorPalette.isIslands` to select the correct scheme.

```kotlin
val palette = JewelTheme.colorPalette
val blue = if (palette.isIslands) palette.blueOrNull(10) else palette.blueOrNull(1)
```

Islands palettes share values across light and dark themes. Classic palettes differ
between those themes. Islands adds semantic tokens above its palette. Jewel cannot read
those tokens directly. Read them from the Swing look and feel when needed.

Official Islands themes also include classic palette entries. Avoid depending on those
entries. Third-party themes and future official themes can omit them.

## See also

- [The Swing bridge](swing-bridge.md) — the plugin side
- [Typography and fonts](typography.md) — text styles in detail
- [Decorated windows](decorated-windows.md) — styling the title bar
