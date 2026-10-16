# Standalone app

Jewel gives Compose Multiplatform desktop apps the Int UI appearance without an IntelliJ
Platform dependency. Applications control their own theme and window setup.

For plugin setup, follow [In an IntelliJ plugin](plugin.md).

## Before you start

Jewel requires the **JetBrains Runtime (JBR)** for font loading and window decoration
patches. Other JDKs have no support. Set the toolchain vendor explicitly:

```kotlin
kotlin {
    jvmToolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.JETBRAINS
    }
}
```

Setting `languageVersion` alone lets Gradle choose any vendor's JDK with that version.
Without JBR, `DecoratedWindow` throws an exception.

## Repositories

Resolve the Compose Multiplatform Gradle plugin through the Gradle Plugin Portal.
Resolve its artifacts through Maven Central and Google's repository.

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        google()
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
```

## Plugins

Apply Kotlin, Compose Multiplatform, and the Compose compiler plugin.
The Compose compiler requires its own plugin declaration:

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "..."                             // Kotlin version
    id("org.jetbrains.compose") version "..."               // Compose Multiplatform version
    id("org.jetbrains.kotlin.plugin.compose") version "..." // Kotlin version, not Compose
}
```

Since Kotlin 2.0, the Kotlin repository distributes the Compose compiler separately from
Compose Multiplatform. Use the **Kotlin** version for both Kotlin plugins. Select the
Compose Multiplatform plugin version separately. All three plugins are required.

Choose versions compatible with Jewel's build. Release notes list the targeted Compose
Multiplatform version. The minimum supported IntelliJ Platform determines the minimum
Kotlin version.

!!! warning "Convention plugins"
    With convention plugins, initialise these plugins once. For example, declare them
    in the root build script with `apply false`. Then apply them in the modules that
    need them. Repeated initialisation causes resolution failures.

## Dependencies

```kotlin
dependencies {
    implementation("org.jetbrains.jewel:jewel-int-ui-standalone:[jewel-version]-[ijp-build]")

    // Optional, for custom window decoration
    implementation("org.jetbrains.jewel:jewel-decorated-window:[jewel-version]-[ijp-build]")

    // Jewel replaces Material; do not let it in
    implementation(compose.desktop.currentOs) {
        exclude(group = "org.jetbrains.compose.material")
    }
}
```

Versions use the form `{{artifact}}`. The Jewel version precedes the IntelliJ Platform
build used for compilation. See [Versions and compatibility](../versioning.md) to select
a published combination.

## Wrap your UI

Place all Jewel components inside a theme wrapper:

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme
import org.jetbrains.jewel.ui.component.DefaultButton
import org.jetbrains.jewel.ui.component.Text

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "Jewel") {
        IntUiTheme(isDark = true) {
            Column {
                Text("Int UI, outside the IDE")
                DefaultButton(onClick = { /* … */ }) {
                    Text("Open")
                }
            }
        }
    }
}
```

To supply custom theme definitions or component styles, use the other `IntUiTheme`
overloads described in [Theming](../guides/theming.md). To replace the system title bar
with IDE-style decoration, follow [Decorated windows](../guides/decorated-windows.md).

## Platform icons

`AllIconsKeys` loads IntelliJ Platform icons. Standalone apps must add those icons to the
classpath. Declare the icons artifact and its repository:

```kotlin
repositories {
    // Pick the one matching the IJP build you target
    maven("https://www.jetbrains.com/intellij-repository/releases")
    maven("https://www.jetbrains.com/intellij-repository/snapshots")
}

dependencies {
    implementation("com.jetbrains.intellij.platform:icons:[ijp-version]")
}
```

You can also copy the required icons into application resources at their original paths.
The artifact is smaller and requires less setup. See [Icons](../guides/icons.md) to load
custom resources.

## Next

- [Theming](../guides/theming.md) — customising Int UI, or leaving it behind
- [Portable UI](../best-practices/portable-ui.md) — writing composables that also run
  inside a plugin
