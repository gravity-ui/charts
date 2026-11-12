# Series plugin migration plan

Remaining work toward a plugin contract that a new series author can use without reading core implementation. Remove completed tasks from this file.

Keep one `SeriesPlugin`, preserve existing built-in behavior and public configuration, and keep series-specific decisions inside plugins. External packages remain a separate scope from adding a built-in series to this repository.

## 1. Simplify the author-facing contract

Use the current custom fixture and metadata/lookup regressions to compare designs. Before changing hook signatures, add one chart-mount regression for that fixture; expand the same example in step 2 rather than building a separate demonstration now.

- Make a minimal custom declaration independent of built-in series unions. Its prepared data must not unexpectedly resolve to `never`.
- Compare retaining the current generic parameters with consolidating associated types into one map. Prefer the map with useful defaults and inference if it reduces the minimal declaration while preserving hook associations. Add an inference helper only if the comparison demonstrates a need; do not introduce a second plugin contract.
- Let a plugin omit unused markers, annotations, HTML labels, hover decoration, and tooltip. Supply empty behavior in core instead of requiring repeated arrays and no-op functions.
- Make option types reflect actual runtime stages: raw preparation options, merged defaults, and any resolved options. Introduce normalization only for a concrete plugin requirement, not merely to justify a separate type.
- Define the guarantees for Cartesian axes, scales, split plots, coordinate origins, and units. Add a projection helper or change the argument shape only where the example exposes repeated internal knowledge.
- Specify hook lifecycle: preparation per layer, additional layout/gradient passes, resize and data updates, DOM ownership, async completion, cancellation, and cleanup. Keep type erasure at the heterogeneous registry boundary.
- Migrate built-in declarations to the selected form and run the existing behavior checks. Record why the chosen declaration is simpler than the alternative.

Acceptance:

- The minimal declaration names only the types and capabilities it needs; incompatible hook payloads still fail type checking.
- A plugin can render without declaring unsupported decorations or tooltip behavior.
- The chart-mount regression and existing built-in tests pass throughout the change. No public config or rendering behavior changes as a side effect of simplifying types.

## 2. Verify the complete new-series workflow

Expand the regression from step 1 using the selected contract. This is the full integration check and the source for the later walkthrough.

- Use a genuinely new series type with its own raw points, prepared data, geometry, and callback payloads. Keep the minimum implementation separate from optional capability demonstrations.
- Exercise validation, preparation, chart layout/rendering, legend/visibility, tooltip, and interaction through the chart component. Direct hook calls alone do not establish support.
- Cover two series, a mixed chart, visibility changes, data replacement, resize, and unmount/cleanup. Check empty input and zero-sized plots; test oversized or negative space where the plugin performs layout math.
- Assert original point identity, distinct series/layers, intended tooltip content, and correct SVG targets. Add regressions for gaps found by integration; reuse existing invariant tests rather than duplicating their matrices.
- Verify registration/defaults in isolation from Jest's automatic built-in setup. Keep any temporary bridge to the closed host types local to the test harness; do not weaken plugin hooks or treat that bridge as an external API.

Acceptance: the new type works through the real chart lifecycle using the simplified contract, with no hidden prepared fields or payload conventions needed to make the test pass.

## 3. Finish the author walkthrough

Build on the shortened [plugin guide](../../docs/diplodoc/pages/development/adding-series-plugin.md) after steps 1 and 2 settle the contract and prove the workflow.

- Derive the complete minimal implementation from the checked example, with explicit imports and definitions. Explain raw data, prepared series, geometry, and rendering before optional features.
- Document the supported in-repository integration path: raw/options unions, prepared type aggregation, public exports, registration, and styles. Do not imply that an installed package already supports external registration.
- Keep the main path short: define data, prepare/render, connect the plugin, then add tooltip/interaction. Put advanced guarantees next to the relevant contract; keep contribution checks separate from the implementation example.
- Verify that following the guide produces the checked chart. Use `docs/examples` for a live demonstration when the documented connection path supports it; do not hide a test-only type bridge inside a user example. An external-package demo belongs to step 4.

Acceptance: an author can add the demonstrated series by following the guide without copying another plugin's internals. The example and instructions describe a supported workflow and stay synchronized with checked source.

## 4. Optional: external plugins and selective imports

Start after the internal contract and workflow are verified. External registration and selective built-in imports can be delivered separately; neither blocks the internal work above.

- Design the plugin-author entry point and extensible config, options, tooltip, and interaction types. Preserve existing exports and the default built-in usage.
- Compare explicit per-chart plugin collections with global registration. Define duplicate identifiers, isolation, and multiple-library-copy behavior before publishing an API.
- For selective imports, make plugin registration and stylesheet inclusion explicit and verify that unused built-ins are excluded.
- Test an external consumer against the built CJS/ESM package using supported imports and types only. Update the guide with the verified imports, connection, type-extension instructions, and runnable example.

Acceptance: a consumer can build and render a new plugin without editing library sources, importing private modules, or casting away public config errors. Selective imports retain required styles and behavior without loading every built-in.

## Verification for each change

Run type checking and focused regression tests. Use Docker for affected browser behavior and visual checks; inspect changed snapshots and preserve unrelated baselines. Check builds when package boundaries change. For public config changes, run `npm run test:chart-config` and inspect both the standalone declaration and JSON Schema. Keep the guide accurate during implementation rather than postponing corrections until step 3.
