# Decorated windows

Jewel uses the JetBrains Runtime to replace a system title bar with application content.
Standalone apps can use the same title bar features as the IDE.

Use these APIs in standalone apps. The IDE owns plugin windows.

## The window

Replace Compose's `Window` with `DecoratedWindow`. It accepts familiar arguments,
including `state`, `title`, `icon`, `resizable`, and key event handlers.
It also accepts a `DecoratedWindowStyle`.

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

The content lambda uses `DecoratedWindowScope` to provide access to the title bar.

!!! warning "This needs the JetBrains Runtime"
    `DecoratedWindow` checks for the JBR on first composition and throws if it is
    missing:

    ```text
    DecoratedWindow can only be used on JetBrainsRuntime(JBR) platform
    ```

    Check whether Gradle selected another vendor's JDK with the requested version.
    Pin the vendor as described in [pinning the toolchain
    vendor](../start/standalone.md#before-you-start).

## The title bar

Call `TitleBar` inside a decorated window. The extension requires `DecoratedWindowScope`.
Its content receives `DecoratedWindowState`. Use this state to respond to focus,
maximisation, and fullscreen changes.

```kotlin
import androidx.compose.ui.Modifier
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

Set `gradientStartColor` to tint the bar from its left edge. The IDE uses this tint for
the per-project colour stripe.

On macOS, `Modifier.newFullscreenControls()` positions the window buttons for the newer
fullscreen control layout. Other platforms do not use this modifier.

## Making parts of the bar clickable

By default, dragging the title bar moves the window. Add `Modifier.clientRegion` to
interactive controls so hit-testing treats those regions as application content.

```kotlin
import org.jetbrains.jewel.window.utils.clientRegion

TitleBar {
    Dropdown(Modifier.clientRegion("view-switcher")) {
        // …
    }
}
```

The key identifies the registered region. Apply the modifier to every interactive title
bar element. Without it, controls display normally but cannot respond to interaction.

## Styling

Component styling supplies title bar styles. Jewel includes three variants:

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

Import the companion extensions `TitleBarStyle.light()`, `dark()`, and
`lightWithLightHeader()` from `org.jetbrains.jewel.intui.window.styling`.
Each accepts colours, metrics, and icons for selective overrides.

The nullable `windowStyle` and `titleBarStyle` arguments of `decoratedWindow()` default to
null. Null selects styles matching the theme's light or dark setting.

## Which dependency

Add `jewel-decorated-window` using the [standalone dependency
instructions](../start/standalone.md#dependencies). This module includes window
primitives and Int UI styling.

The older `jewel-int-ui-decorated-window` artifact remains for compatibility and contains
no code. Older documentation describes separate styled and unstyled modules.
The current module combines them. New code must depend directly on
`jewel-decorated-window`.

## See also

- [Theming](theming.md) — component styling in general
- [Standalone app](../start/standalone.md) — setup, including the toolchain vendor
