# Decorated windows

The JetBrains Runtime lets a window replace the system title bar with its own content.
That is how the IDE gets the title bar it has, and Jewel exposes the same capability, so a
standalone app can look like one.

This is standalone territory. In a plugin the IDE owns the window.

## The window

`DecoratedWindow` replaces Compose's `Window`. It takes the same arguments you already know
— `state`, `title`, `icon`, `resizable`, the key event handlers — plus a
`DecoratedWindowStyle`.

```kotlin
import androidx.compose.ui.window.application
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme
import org.jetbrains.jewel.window.DecoratedWindow

fun main() = application {
    IntUiTheme(isDark = true) {
        DecoratedWindow(onCloseRequest = ::exitApplication, title = "My app") {
            // window content
        }
    }
}
```

Its content lambda runs in `DecoratedWindowScope`, which is what makes the title bar
available.

!!! warning "This needs the JetBrains Runtime"
    `DecoratedWindow` checks for the JBR on first composition and throws if it is missing:

    ```text
    DecoratedWindow can only be used on JetBrainsRuntime(JBR) platform
    ```

    If you hit this, your Gradle toolchain is almost certainly resolving a different JDK of
    the right version. Pin the vendor — see [Standalone setup](../start/standalone.md#before-you-start).

## The title bar

`TitleBar` is an extension on `DecoratedWindowScope`, so it can only appear inside a
decorated window. Its content lambda receives the current `DecoratedWindowState`, which is
how you react to the window being focused, maximised or fullscreen.

```kotlin
import org.jetbrains.jewel.window.DecoratedWindow
import org.jetbrains.jewel.window.TitleBar
import org.jetbrains.jewel.window.newFullscreenControls

DecoratedWindow(onCloseRequest = ::exitApplication) {
    TitleBar(Modifier.newFullscreenControls()) { windowState ->
        // whatever belongs in your title bar
    }

    // the rest of your window
}
```

`gradientStartColor` tints the bar from the left, which is what the IDE uses for the
per-project colour stripe.

`Modifier.newFullscreenControls()` is macOS-only and positions the traffic lights for the
newer fullscreen control layout.

## Making parts of the bar clickable

A custom title bar creates a problem: the whole bar drags the window, so anything
interactive in it would be unusable. `Modifier.clientRegion` marks a region as client
area — hit-testing then treats it as content rather than as draggable chrome.

```kotlin
import org.jetbrains.jewel.window.utils.clientRegion

TitleBar {
    Dropdown(Modifier.clientRegion("view-switcher")) {
        // …
    }
}
```

The key is just an identifier for the registered region. Forget the modifier and the
control will look right and do nothing, which is a confusing bug to chase — so add it to
every interactive element you put in the bar.

## Styling

Title bar styling arrives through component styling, with three ready-made variants:

```kotlin
import org.jetbrains.jewel.intui.window.decoratedWindow
import org.jetbrains.jewel.intui.window.styling.dark
import org.jetbrains.jewel.intui.window.styling.light
import org.jetbrains.jewel.intui.window.styling.lightWithLightHeader
import org.jetbrains.jewel.window.styling.TitleBarStyle

IntUiTheme(
    theme = themeDefinition,
    styling = ComponentStyling.default().decoratedWindow(titleBarStyle = TitleBarStyle.dark()),
) {
    // …
}
```

`TitleBarStyle.light()`, `dark()` and `lightWithLightHeader()` are extensions on the
companion, in `org.jetbrains.jewel.intui.window.styling`. Each takes colours, metrics and
icons, so you override a piece without rebuilding the rest.

`decoratedWindow()` takes `windowStyle` and `titleBarStyle`, both nullable and both
defaulting to null, in which case they follow the theme's light or dark setting.

## Which dependency

Add `jewel-decorated-window`, as
[Standalone setup](../start/standalone.md#dependencies) shows. Both the window primitives and
the Int UI styling live in it.

You may come across `jewel-int-ui-decorated-window`, and older material describing the two as
an unstyled/styled split. That is no longer how it works: the Int UI styling sits in the same
module as the primitives, and `int-ui-decorated-window` is an older artifact kept for
compatibility that contains no code of its own. New code should depend on
`jewel-decorated-window` directly.

## See also

- [Theming](theming.md) — component styling in general
- [Standalone app](../start/standalone.md) — setup, including the toolchain vendor
