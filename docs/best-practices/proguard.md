# ProGuard and minification

Running Jewel with ProGuard, R8, or similar tools has no official support.

The team rejects bug reports caused by minification or obfuscation. Minifier
configuration affects failures and can make diagnosis difficult.

## Unofficial rules

Some projects successfully minify Jewel. No official rule set exists. The [Kotlin
Explorer](https://github.com/romainguy/kotlin-explorer/blob/main/compose-desktop.pro)
rules work for some projects and can provide a starting point.

Maintain these rules yourself. Compose and Jewel use reflection and resource loading
that minifiers cannot always detect. Upgrades can break previously working rules.
Failures often appear as missing resources or crashes far from the affected code.

## What to do instead

To reduce distribution size, use Compose Multiplatform packaging. It creates a runtime
image with only the modules you use. This gives most of the size benefit without
minifier-related failures.

Before choosing obfuscation, account for the support limits. You must diagnose resulting
UI-layer bugs yourself.
