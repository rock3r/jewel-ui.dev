# Portable UI

Wrap plugin content in `SwingBridgeTheme` and standalone content in `IntUiTheme`.
Both wrappers provide the same component API:

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

Both environments use the same `IssueList`. The component library
(`org.jetbrains.jewel.ui.component`) and foundation module support both themes without
IntelliJ Platform dependencies. Only the bridge module depends on the platform.

Separate platform dependencies from UI code to support reuse and tests.

## Separate platform code from UI code

Pass plain data and callbacks to composables.

A composable that accepts `Project`, requests `Service`, or resolves `VirtualFile`
requires the IDE. Plain data and callbacks let composables run in other environments.

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

Put platform access behind an application-owned interface outside the UI:

```kotlin
interface IssueSource {
    fun issues(): List<Issue>
}
```

Implement the interface with platform calls in the plugin. In tests or standalone
harnesses, return test data. Composables use the same interface in both cases.

## Test UI without the IDE

Composables without platform dependencies can run under the standalone theme in plain
JVM tests. These tests need no sandbox IDE or platform fixture.

Use standalone tests for UI behaviour. Test integrations that require the IDE separately
in platform-hosted tests.

Supply fake data through your interface. Render the composable inside `IntUiTheme` and
assert on its output.

## Reuse UI in a desktop app

A shared source tree can provide screens for an IDE plugin and a standalone desktop app.
This structure supports companion apps and plugins without separate copies of UI code.

## Rendering differs between environments

The shared API can produce different pixels in each environment.

The bridge deliberately enables Swing compatibility mode to align Compose and Swing text.
It also supplies platform-backed typography, icon painting, clipboard handling, and
density scaling. Shared code compiles and runs in either environment. Different theme
values can change the rendered appearance slightly.

Standalone tests cover behaviour, structure, and state. Check plugin pixels inside the
IDE. Standalone renders cannot establish the plugin's exact appearance.

## See also

- [The Swing bridge](../guides/swing-bridge.md) — what the bridge reads, and its limits
- [Theming](../guides/theming.md) — supplying your own theme to either side
