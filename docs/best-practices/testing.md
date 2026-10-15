# Testing your UI

Jewel lets you test a plugin's UI without starting the IntelliJ Platform.

## Test against the standalone theme

The components below the theme are the same in both worlds ([Portable
UI](portable-ui.md)). So a composable that takes plain data and callbacks can be
rendered under `IntUiTheme` in an ordinary JVM test, with no IDE involved:

```kotlin
@Test
fun `shows an empty state when there are no issues`() {
    composeRule.setContent {
        IntUiTheme(isDark = false) {
            IssueList(issues = emptyList(), onSelect = {})
        }
    }

    composeRule.onNodeWithText("No issues").assertExists()
}
```

The test runs without a sandbox IDE and checks the composable's output.

The prerequisite is the discipline in [Portable UI](portable-ui.md): if the composable
needs a `Project`, none of this is available to you.

## What this does and does not prove

**It proves** structure, state handling, and behaviour: what renders for a given state,
what a click does, whether the empty and error states appear when they should, whether
content is reachable and labelled.

**It does not prove appearance inside the IDE.** The bridge supplies different values
and switches on Swing compatibility mode, so pixels can differ. Do not treat a
standalone render as a preview of the plugin, and do not screenshot-test the standalone
render as a proxy for what users see.

For appearance, look at the real thing in the IDE.

## Accessibility is covered too

Jewel's lists and trees expose selection state to screen readers, and take content
descriptions from their children. Decorative chrome — dividers, scrollbars — is kept out
of the accessibility tree deliberately.

That means semantics-based queries in tests generally match what assistive technology
sees, so asserting on accessible names is both a UI test and a check that the UI is
navigable. If a node is hard to find in a test, that is usually a real finding rather
than a test problem.

## Testing the parts that need the IDE

Some things do need the platform: the bridge itself, anything reading a real
`DataContext`, anything driven by platform actions. Test those where they live, with the
platform's own test infrastructure, and keep that set as small as you can.

Use platform-hosted tests for IDE integration and standalone tests for UI behaviour.

## See also

- [Portable UI](portable-ui.md) — the structure that makes this possible
