# Testing your UI

Test platform-independent plugin UI with Jewel's standalone theme without starting the
IntelliJ Platform.

## Test against the standalone theme

Plugin and standalone themes share the same components. Composables accepting plain
data and callbacks can run inside `IntUiTheme` in ordinary JVM tests. See [Portable
UI](portable-ui.md) for the required structure.

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

This test checks the composable's output without launching a sandbox IDE.

Remove platform dependencies before using this approach. A composable requiring
`Project` still needs an IDE-hosted test.

## What this does and does not prove

Standalone tests check structure, state handling, and behaviour. Assert on rendered
content, click results, empty states, error states, reachability, and labels.

These tests cannot establish appearance inside the IDE. Bridge theme values and Swing
compatibility mode can change pixels. Standalone screenshots cannot replace screenshots
of the plugin running in its IDE host.

Inspect the running plugin in the IDE to check its appearance.

## Accessibility is covered too

Lists and trees expose selection state to screen readers. Their children supply content
descriptions. Jewel deliberately excludes decorative elements, including dividers and
scrollbars, from the accessibility tree.

Semantics-based test queries generally use the same information as assistive technology.
Accessible-name assertions check UI behaviour and navigation. Investigate nodes that
tests cannot locate for possible accessibility defects.

## Testing the parts that need the IDE

The bridge, real `DataContext` access, and platform actions require the IDE.
Cover these integrations with the platform's test infrastructure. Limit platform-hosted
tests to code that requires it.

Keep UI behaviour tests under the standalone theme and integration tests in the IDE host.

## See also

- [Portable UI](portable-ui.md) — the structure that makes this possible
