# Series plugin migration plan

Remaining work after the internal ownership migration. The next goal is a contract that lets a developer add a new series without discovering undocumented requirements in core. Keep only unfinished work here; remove completed items.

## 1. Make runtime requirements explicit

- Define the minimum prepared-series metadata consumed by core: identity, visibility, legend, tooltip, and other fields required by shared consumers. Enforce it in `SeriesPluginData.prepared`; `{type}` alone is insufficient. Provide a shared preparation helper or a core-owned metadata envelope so plugins do not duplicate common defaults.
- Define series identity across preparation calls and layers. Preserve user IDs and ensure generated IDs are chart-unique; local array indices must not collide when core prepares layers independently.
- Retain plugin ownership when core collects tooltip and interaction lookup data. Route opaque plugin payloads using that ownership instead of probing `series.type`, `point.series.type`, or `type`.
- Specify how direct tooltip chunks and X-aligned lookup points compose, including active selection and distance in mixed charts. Prevent accidental duplicate rows for the same sample without preventing intentionally distinct tooltip content.
- Correct the custom fixture's missing metadata, duplicate IDs, duplicate tooltip contributions, and repeated SVG targets. Add focused regressions for the actual invariants rather than preserving the current fixture output.

Acceptance:

- A prepared series that lacks core-required metadata fails type checking.
- A series with its legend disabled still passes shared preparation and visibility handling.
- Two series prepared in separate calls retain distinct identities and the intended layers.
- Lookup routing does not depend on the shape of a plugin's private payload.
- One hovered sample produces the intended tooltip content; each painted SVG target maps to its own original point and series.

## 2. Verify a new plugin through the shared pipeline

- Replace the isolated-hook demonstration with a minimal working plugin that uses a new series type, its own raw data, prepared data, geometry, and callback payloads. Keep optional capability examples separate from the minimum implementation.
- Exercise chart preparation and rendering, including shared legend, visibility, tooltip selection, and interaction. Calling each plugin method independently is not sufficient integration coverage.
- Cover two series, a mixed chart, visibility changes, data replacement, resize, and cleanup. Check empty input and zero-sized plots; when reviewing projection or padding, also check oversized requests and negative computed space.
- Verify raw point identity in callbacks, absence of duplicate tooltip rows, and correct targeting of multiple SVG elements.
- Keep negative compile-time checks for incompatible prepared, render, lookup, and callback data. Test registration/defaults without Jest's automatic built-in registration.
- Until external chart typing is implemented, keep any bridge to the closed built-in host types explicit and local to the integration harness. Do not weaken plugin hooks or present the harness as a supported external API.

Acceptance: the example demonstrates a new plugin working with core, and its focused tests detect the integration defects from step 1.

## 3. Simplify the single SeriesPlugin contract

Keep one `SeriesPlugin` contract. Complete steps 1 and 2 before choosing its final ergonomic form.

Evaluate two approaches against the working example:

- Minimal change: retain the current generic parameters and add sensible defaults. This limits migration work but leaves more declarations for authors.
- Recommended direction: consolidate associated types into one map, infer types where reliable, and give unused capabilities defaults. Consider an optional inference helper only if it demonstrably simplifies the example; it must not introduce a competing plugin interface.

Tasks:

- Avoid requiring the full built-in chart context for a new type. A minimal custom declaration must not unexpectedly resolve its prepared data to `never`.
- Make markers, annotations, HTML labels, hover decoration, and tooltip optional when the plugin does not provide them. Core supplies empty behavior; plugins should not need repeated empty arrays and no-op functions.
- Make the relationship between raw options, merged defaults, and prepared options explicit. Do not let types promise normalization that the runtime never performs; add a preparation hook only if a concrete plugin needs it.
- Provide a coherent Cartesian projection context or helper instead of making authors reconstruct valid combinations of optional axes, scales, and split plots. Document coordinate origins and units, including split-local padding measurements.
- Specify lifecycle guarantees: preparation per layer, repeated layout/gradient work, resize and data updates, render containers, async completion, cancellation, and cleanup. Replace inaccurate invocation-count descriptions.
- Keep heterogeneous type erasure localized to the registry boundary. Concrete plugin declarations and hook payloads retain their associations.

Acceptance:

- The minimal example declares only the types and capabilities it uses, with no casts hiding incompatible hook data.
- All built-in plugins preserve their behavior and configuration. Shared runtime remains free of series-name dispatch and plugin implementation imports.
- Type checks and focused regressions establish the chosen API's guarantees before it becomes public.

## 4. Simplify the plugin guide

Rewrite [Adding a series plugin](../../docs/diplodoc/pages/development/adding-series-plugin.md) around a first working result, using the verified example from step 2 and the contract selected in step 3:

1. Define input data and prepare a series.
2. Prepare geometry and render it.
3. Register the plugin and display the chart.
4. Add tooltip content and interaction when needed.

- Start with a complete minimal example with explicit imports. Explain the flow from raw data to prepared series, geometry, and rendering before introducing associated types.
- Describe the currently supported in-repository integration path, including required union, export, and registration edits. Keep its distinction from an external plugin package clear.
- Move axes, zoom, padding, layers, gradients, detailed hit testing, and async rendering to an advanced reference. Put guarantees next to the relevant capability.
- Separate the built-in contribution checklist (files, exports, tests, stories, config artifacts, and documentation) from the implementation walkthrough.
- Remove built-in-specific algorithms, header-priority trivia, and edge-case matrices from the main path. Keep relevant short caveats beside their explanation.
- Derive examples from checked source so the guide cannot refer to a fixture that only passes isolated method calls. Use `docs/examples` for an embedded live chart.

Acceptance: a developer can follow the guide to add the example series without reading another plugin's implementation or relying on undocumented core fields.

## 5. Optional: external plugins and selective imports

This is a separate delivery stage after the contract and example are stable. It remains outside the internal migration.

- Design a supported plugin-author entry point and extensible chart config, options, tooltip, and interaction types. Preserve existing public exports and built-in usage.
- Compare explicit per-chart plugin collections with global registration. Decide how registration, duplicate identifiers, isolation, and multiple library copies behave before publishing the API.
- Design selective built-in imports and stylesheet inclusion without relying on accidental registration side effects.
- Verify the documented workflow from a consumer outside this repository, using the built package and supported imports only.
- When public config changes, run `npm run test:chart-config` and inspect the standalone declaration and JSON Schema. Check CJS/ESM builds and selective-import behavior.
- Update the guide with external imports, connection, and type-extension instructions only when that workflow is supported.

Acceptance: an external consumer can build and render a new plugin without editing library sources, using deep internal imports, or casting away public config errors.

## Verification while implementing

For each step, run type checking and focused unit/integration tests. Use Docker visual tests for affected rendering and inspect every changed snapshot. Preserve unrelated baselines; run public config artifact checks when those types change. Keep the working example and guide synchronized with the final contract.
