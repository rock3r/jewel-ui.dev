plugins { base }

val dokkaVersion: String by project
val jewelVersion: String by project

val modules = listOf(
    "jewel-foundation",
    "jewel-ui",
    "jewel-int-ui-standalone",
    "jewel-decorated-window",
    "jewel-markdown-core",
    "jewel-markdown-int-ui-standalone-styling",
)

val dokkaCp by configurations.creating
dependencies {
    dokkaCp("org.jetbrains.dokka:dokka-cli:$dokkaVersion")
    dokkaCp("org.jetbrains.dokka:dokka-base:$dokkaVersion")
    dokkaCp("org.jetbrains.dokka:analysis-kotlin-descriptors:$dokkaVersion")
    // Needed to stitch per-module partial outputs into one publication.
    dokkaCp("org.jetbrains.dokka:all-modules-page-plugin:$dokkaVersion")
    dokkaCp("org.jetbrains.dokka:templating-plugin:$dokkaVersion")
}

val moduleBins = modules.associateWith { id ->
    configurations.create(id.replace('-', '_') + "Bin").also { cfg ->
        dependencies.add(cfg.name, "org.jetbrains.jewel:$id:$jewelVersion")
    }
}
val moduleSrcs = modules.associateWith { id ->
    configurations.create(id.replace('-', '_') + "Src").also { cfg ->
        dependencies.add(
            cfg.name,
            mapOf(
                "group" to "org.jetbrains.jewel",
                "name" to id,
                "version" to jewelVersion,
                "classifier" to "sources",
                "ext" to "jar",
            ),
        )
    }
}

tasks.register("resolveAll") {
    doLast {
        val out = layout.buildDirectory.dir("resolved").get().asFile
        out.mkdirs()
        File(out, "dokka-plugins.txt").writeText(
            dokkaCp.resolve()
                .filter { !it.name.startsWith("dokka-cli") }
                .joinToString("\n") { it.absolutePath },
        )
        File(out, "dokka-cli.txt").writeText(
            dokkaCp.resolve().first { it.name.startsWith("dokka-cli") }.absolutePath,
        )
        modules.forEach { id ->
            File(out, "$id-classpath.txt").writeText(
                moduleBins.getValue(id).resolve().joinToString("\n") { it.absolutePath },
            )
            File(out, "$id-sources.txt").writeText(
                moduleSrcs.getValue(id).resolve().single().absolutePath,
            )
        }
        File(out, "modules.txt").writeText(modules.joinToString("\n"))
        File(out, "version.txt").writeText(jewelVersion)
        println("resolved ${modules.size} modules for $jewelVersion")
    }
}
