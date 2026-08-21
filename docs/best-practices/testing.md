# Testing your UI

Compose UI is testable in a way Swing UI mostly was not, and Jewel's structure means a
plugin's UI can be tested without starting the platform.

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

That runs in seconds rather than minutes, does not need a sandbox IDE, and fails for
reasons that are about your UI. Platform-hosted UI tests are slow enough and flaky
enough that people learn to ignore them. A test people ignore is worse than no test.

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

The split is the point. A small number of slow, platform-hosted tests around the seam,
and a large number of fast tests for the UI behind it.

## See also

- [Portable UI](portable-ui.md) — the structure that makes this possible
