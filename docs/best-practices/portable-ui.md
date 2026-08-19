# Portable UI

The two ways of using Jewel differ in one line. `SwingBridgeTheme` in a plugin,
`IntUiTheme` in a standalone app — and everything inside that wrapper is the same API.

```kotlin
// In a plugin
SwingBridgeTheme {
    IssueList(state, onAction)
}

// In a standalone app
IntUiTheme(isDark = true) {
    IssueList(state, onAction)
}
```

`IssueList` does not change. This is not a coincidence of the current release: the
component library (`org.jetbrains.jewel.ui.component`) and the foundation layer sit below
both themes, and neither depends on the IntelliJ Platform. The platform dependency is
confined to the bridge module.

That portability is worth designing for, because two useful things fall out of it.

## Keep the platform at the edge

The constraint is simple: **no IntelliJ Platform types in your composables.**

A composable that takes a `Project`, reaches for a `Service`, or resolves a `VirtualFile`
can only ever run inside the IDE. One that takes plain data and callbacks runs anywhere.

```kotlin
// Not portable: the platform is inside the UI
@Composable
fun IssueList(project: Project) {
    val issues = project.service<IssueService>().all()
    // …
}

// Portable: the UI takes data and reports intent
@Composable
fun IssueList(issues: List<Issue>, onSelect: (Issue) -> Unit) {
    // …
}
```

Everything platform-shaped moves outward, behind an interface you own:

```kotlin
interface IssueSource {
    fun issues(): List<Issue>
}
```

In the plugin, the implementation reaches into the platform. In a test or a standalone
harness, it returns whatever you want. The composable neither knows nor cares.

None of this is specific to Jewel — it is ordinary separation of concerns — but Jewel is
what makes it pay off twice.

## Which makes it testable

Once your composables have no platform types, they can be tested against the standalone
theme in a plain JVM test. No sandbox IDE, no platform fixture, no waiting for an IDE to
start.

That is faster, and it is also more honest: the test exercises your UI rather than the
harness around it. Platform-hosted UI tests are slow and prone to flaking on things that
have nothing to do with the code under test, and a test that fails for unrelated reasons
gets ignored.

The practical shape is: drive the composable with fake data through your own interface,
render it under `IntUiTheme`, and assert on what it shows.

## And reusable

The same screen can ship inside an IDE plugin and inside a standalone desktop app, from one
source tree, with no forked UI code to keep in step. If you have ever wanted a companion
desktop app for a plugin, or a plugin for a desktop app, this is the part that makes it
merely work rather than a rewrite.

## The caveat

Portable means *the same API*, not *pixel-identical output*.

The bridge deliberately behaves differently in places. It enables Swing compatibility mode
so Compose text aligns with Swing text, and it swaps in platform-backed providers for
typography, icon painting, clipboard handling and density scaling. Your code compiles and
runs identically either way; what it renders can differ slightly, because the values behind
the theme differ by design.

So: use standalone to test behaviour, structure and state. Do not use it as a pixel
reference for what the plugin will look like inside the IDE.

## See also

- [The Swing bridge](../guides/swing-bridge.md) — what the bridge reads, and its limits
- [Theming](../guides/theming.md) — supplying your own theme to either side
