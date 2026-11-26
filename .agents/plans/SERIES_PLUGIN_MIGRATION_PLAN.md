# Series plugin migration plan

Remaining work toward plugins that can be supplied outside this repository. Remove completed tasks from this file.

Keep one `SeriesPlugin`, preserve existing built-in behavior and public configuration, and keep series-specific decisions inside plugins. The internal contract, complete new-series lifecycle, and [author walkthrough](../../docs/diplodoc/pages/development/adding-series-plugin.md) are verified; external packages remain a separate scope.

## 1. Optional: external plugins and selective imports

External registration and selective built-in imports can be delivered separately. Neither is required for adding a series inside this repository.

- Design the plugin-author entry point and extensible config, options, tooltip, and interaction types. Preserve existing exports and the default built-in usage.
- Compare explicit per-chart plugin collections with global registration. Define duplicate identifiers, isolation, and multiple-library-copy behavior before publishing an API.
- For selective imports, make plugin registration and stylesheet inclusion explicit and verify that unused built-ins are excluded.
- Test an external consumer against the built CJS/ESM package using supported imports and types only. Update the guide with the verified imports, connection, type-extension instructions, and runnable example.

Acceptance: a consumer can build and render a new plugin without editing library sources, importing private modules, or casting away public config errors. Selective imports retain required styles and behavior without loading every built-in.

## Verification for each change

Run type checking and focused regression tests. Exercise new integration behavior through `Chart`, including mixed series, validation, legend/visibility, original-point callbacks, data replacement, resize, and cleanup. Reuse existing invariant tests rather than duplicating their matrices.

Use Docker for affected browser behavior and visual checks; inspect changed snapshots and preserve unrelated baselines. Check builds when package boundaries change. For public config changes, run `npm run test:chart-config` and inspect both the standalone declaration and JSON Schema. Keep the guide accurate during implementation.
