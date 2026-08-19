# In an IntelliJ plugin

Jewel ships inside the IntelliJ Platform from build 251.2 onwards. There is no repository
to add and no dependency to resolve: declare the bundled modules and the platform provides
them.

If you are writing a desktop app rather than a plugin, read
[Standalone app](standalone.md) instead.

## Declare the bundled modules

```kotlin
// build.gradle.kts
dependencies {
    intellijPlatform {
        bundledModule("intellij.platform.jewel.foundation")
        bundledModule("intellij.platform.jewel.ui")
        bundledModule("intellij.platform.jewel.ideLafBridge")
        bundledModule("intellij.libraries.compose.foundation.desktop")
        bundledModule("intellij.libraries.skiko")
    }
}
```

Add the Markdown modules only if you render Markdown:

```kotlin
bundledModule("intellij.platform.jewel.markdown.core")
bundledModule("intellij.platform.jewel.markdown.ideLafBridgeStyling")
```

Because these come from the platform, their version is the platform's version. There is no
Jewel version to choose here, and nothing to keep in sync — see
[Versions and compatibility](../versioning.md) for what that means when you target several
IntelliJ Platform releases.

## Wrap your UI

Plugins use `SwingBridgeTheme`, not the standalone theme. It reads the IDE's current Swing
look and feel and hands it to Compose, so your panel matches whatever theme the user has
chosen — including third-party themes you have never seen.

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.jetbrains.jewel.bridge.theme.SwingBridgeTheme
import org.jetbrains.jewel.ui.component.DefaultButton
import org.jetbrains.jewel.ui.component.Text

@Composable
fun MyPanel() {
    SwingBridgeTheme {
        Column(Modifier.padding(12.dp)) {
            Text("Follows the user's theme")
            DefaultButton(onClick = { /* … */ }) {
                Text("Analyse")
            }
        }
    }
}
```

You do not restyle anything to make this happen, and you do not maintain a mapping from
IDE colours to your own. [The Swing bridge](../guides/swing-bridge.md) explains what is
read and what the limits are.

`SwingBridgeTheme` is marked experimental. In practice it is the only way to theme a
plugin and every Jewel-based plugin uses it, but the annotation is honest: its signature
can change. See [what stable and experimental mean](../versioning.md#what-is-stable-and-what-is-not).

## Adding it to a tool window

Compose and Swing sharing one window needs the newer Swing rendering pipeline switched on.
For tool windows, Jewel does that for you:

```kotlin
import org.jetbrains.jewel.bridge.addComposeTab

class MyToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        toolWindow.addComposeTab("My tab") {
            MyPanel()
        }
    }
}
```

`addComposeTab` calls `enableNewSwingCompositing()` for you. For any other surface — a
dialog, a settings page, an editor notification — you are creating the `ComposePanel`
yourself and have to call it explicitly. See [Swing interop](../guides/swing-interop.md).

## A note on support

Writing third-party IntelliJ plugins in Compose for Desktop is not officially supported by
the IntelliJ Platform. It works, and it is what several shipping products do, but if
something breaks at the platform level you are largely on your own.

Jewel itself is below 1.0 and its APIs still move. What that means in practice — which
APIs are safe to depend on, and how much warning you get before something is removed — is
in [Versions and compatibility](../versioning.md).

## Next

- [The Swing bridge](../guides/swing-bridge.md) — how theme mirroring actually works
- [Icons](../guides/icons.md) — using the platform's icons, which need no setup here
- [Portable UI](../best-practices/portable-ui.md) — keeping platform types out of your
  composables, so they stay testable
