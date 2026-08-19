# Standalone app

Jewel in a Compose for Desktop app that has nothing to do with the IntelliJ Platform. You
get the Int UI look, and you own every part of it.

If you are writing an IntelliJ plugin, read [In an IntelliJ plugin](plugin.md) instead —
the setup is different, and simpler.

## Before you start

Jewel requires the **JetBrains Runtime**. Not as a recommendation: font loading and window
decoration depend on patches that only the JBR has, and running on another JDK is
unsupported. Point your toolchain at it explicitly.

```kotlin
kotlin {
    jvmToolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.JETBRAINS
    }
}
```

Setting only `languageVersion` is a common mistake. Gradle will happily resolve any JDK of
that version, and the first thing to fail is `DecoratedWindow`, which throws outright when
it does not find the JBR.

## Repositories

Compose Multiplatform's Gradle plugin comes from the Gradle Plugin Portal, and its
artifacts from Maven Central and Google's repository.

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        google()
        gradlePluginPortal()
        mavenCentral()
    }
}
```

## Plugins

You need three: Kotlin, Compose Multiplatform, and the Compose compiler plugin. The last
one is separate from the Compose Gradle plugin and is easy to miss.

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "..."
    id("org.jetbrains.compose") version "..."
    id("org.jetbrains.kotlin.plugin.compose") version "..."
}
```

The Kotlin and Compose versions must line up with the ones Jewel is built against. Each
Jewel release notes the Compose Multiplatform version it targets; the minimum Kotlin
version follows from the minimum supported IntelliJ Platform.

!!! warning "Convention plugins"
    If you configure your project with convention plugins, apply these once — for example
    in the root build script with `apply false`, then apply them in the modules that need
    them. Initialising them more than once causes resolution failures.

## Dependencies

```kotlin
dependencies {
    implementation("org.jetbrains.jewel:jewel-int-ui-standalone:[jewel-version]-[ijp-build]")

    // Optional, for custom window decoration
    implementation("org.jetbrains.jewel:jewel-int-ui-decorated-window:[jewel-version]-[ijp-build]")

    // Jewel replaces Material; do not let it in
    implementation(compose.desktop.currentOs) {
        exclude(group = "org.jetbrains.compose.material")
    }
}
```

Version strings look like `0.39.1-262.9437.29`: the Jewel version, then the IntelliJ
Platform build it was compiled against. [Versions and compatibility](../versioning.md)
explains how to pick one, and which combinations exist.

## Wrap your UI

Everything Jewel draws has to sit inside a theme.

```kotlin
import androidx.compose.ui.window.application
import org.jetbrains.jewel.intui.standalone.theme.IntUiTheme
import org.jetbrains.jewel.ui.component.DefaultButton
import org.jetbrains.jewel.ui.component.Text

fun main() = application {
    IntUiTheme(isDark = true) {
        Column {
            Text("Int UI, outside the IDE")
            DefaultButton(onClick = { /* … */ }) {
                Text("Open")
            }
        }
    }
}
```

That is the whole setup. `IntUiTheme` has richer overloads for supplying your own theme
definition and component styling — see [Theming](../guides/theming.md) — and
[Decorated windows](../guides/decorated-windows.md) covers replacing the system title bar
with the IDE's.

## Platform icons

Jewel can load the IntelliJ Platform's own icons through `AllIconsKeys`, but outside the
IDE they are not on the classpath. Add the icons artifact and the repository it lives in:

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

Copying the icons you need into your own resources, at the same paths, works too. The
artifact is simply easier, and small. [Icons](../guides/icons.md) covers loading your own.

## Next

- [Theming](../guides/theming.md) — customising Int UI, or leaving it behind
- [Portable UI](../best-practices/portable-ui.md) — writing composables that also run
  inside a plugin
