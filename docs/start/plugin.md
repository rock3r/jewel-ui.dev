# In an IntelliJ plugin

IntelliJ Platform builds from 251.2 include Jewel. Declare the bundled modules to use
the platform's copy. Setup needs no external repository or dependency.

For desktop application setup, follow [Standalone app](standalone.md).

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

The platform supplies the versions of these modules. Plugins never select a separate
Jewel version. See [Versions and compatibility](../versioning.md) for rules that apply
when targeting several IntelliJ Platform releases.

## Wrap your UI

Wrap plugin content in `SwingBridgeTheme`. It reads values from the IDE's current Swing
look and feel and supplies them to Compose. Your panel follows the user's selected
theme, including supported third-party themes.

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

The bridge supplies these values without manual restyling or a separate colour mapping.
Read [The Swing bridge](../guides/swing-bridge.md) for the values it reads and its limits.

`SwingBridgeTheme` is annotated experimental because its signature can change.
It is the only plugin theme entry point, and every Jewel-based plugin uses it.
See [what stable and experimental
mean](../versioning.md#what-is-stable-and-what-is-not).

## Adding it to a tool window

A window containing Compose and Swing needs the newer Swing rendering pipeline.
For tool windows, `addComposeTab()` enables that pipeline:

```kotlin
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import org.jetbrains.jewel.bridge.addComposeTab

class MyToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        toolWindow.addComposeTab("My tab") {
            MyPanel()
        }
    }
}
```

For dialogs, settings pages, and editor notifications, use `JewelComposePanel`.
That panel also applies `SwingBridgeTheme`. Before creating it or a raw `ComposePanel`,
call `enableNewSwingCompositing()`. See [Swing
interop](../guides/swing-interop.md).

## Compose plugin support is unofficial

The IntelliJ Platform gives no official support for third-party Compose Multiplatform
plugins. Several released products use this approach. Plugin authors must handle most
platform-level failures themselves.

Jewel remains below 1.0, and its APIs can change. Read [Versions and
compatibility](../versioning.md) for API guarantees and deprecation periods.

## Next

- [The Swing bridge](../guides/swing-bridge.md) — how theme mirroring works
- [Icons](../guides/icons.md) — using the platform's icons, which need no setup here
- [Portable UI](../best-practices/portable-ui.md) — keeping platform types out of your
  composables, so they stay testable
