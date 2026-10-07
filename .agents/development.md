# Development conventions

Apply these conventions when writing or reviewing code.

## Sizing

- When adding or reviewing layout size options (e.g. title height or label width), prefer `number | string`: numbers and `"px"` strings denote pixels; `"%"` strings are supported when there is a meaningful reference dimension. Document that dimension explicitly and reuse `calculateNumericProperty` from `src/core/utils/math.ts` to resolve values.
- Preserve existing field contracts, including CSS-valued text styles such as `fontSize`; do not apply this convention automatically to every numeric option.
- Validate new config fields strictly: throw `ChartError` with `INVALID_DATA` for invalid values, including unsupported size formats, non-finite numbers, and negative sizes where only nonnegative values are supported. Preserve legacy fallback behavior (e.g. ignoring invalid `legend.width`/`legend.maxWidth`) for compatibility.

## Series plugins

- When adding a series type, follow [Adding a series plugin](../docs/diplodoc/pages/development/adding-series-plugin.md).
- For upcoming integration changes, see the [series plugin migration plan](plans/SERIES_PLUGIN_MIGRATION_PLAN.md).

## Chart config value descriptions

- For documented string literal choices, put a JSDoc bullet on the schema enum node (on the type alias when a property refers to one): ``- `'value'`: Description``. Document every string choice. Use ``- `null`: Description`` for null. A marker such as `(**recommended**)` may appear between the value and colon.
- Keep other explanatory bullets outside the enum node's JSDoc, or use prose. The chart config generator checks value bullets and emits `enumDescriptions` alongside `enum`.
