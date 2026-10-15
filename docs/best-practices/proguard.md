# ProGuard and minification

Jewel does not support running under ProGuard, R8 or similar tools.

The team does not accept bug reports for issues caused by minification or obfuscation.
Failures depend on the minifier configuration and can be hard to diagnose.

## Unofficial rules

People do, and it can be made to work. There is no official rule set, but the rules used
by [Kotlin
Explorer](https://github.com/romainguy/kotlin-explorer/blob/main/compose-desktop.pro)
are known to work for some projects and are a reasonable starting point.

Expect to maintain them yourself. Compose and Jewel both rely on reflection and resource
loading in places that minifiers cannot see, so a working configuration is a snapshot
rather than a settled answer. An upgrade can break it. The symptom is usually a missing
resource or a crash a long way from the cause.

## What to do instead

If your motivation is distribution size, Compose Multiplatform's own packaging already
gets most of the benefit without the fragility. It produces a runtime image containing
only the modules you use.

If your motivation is obfuscation, weigh it against the support position above. You are
choosing to be on your own for any UI-layer bug.
