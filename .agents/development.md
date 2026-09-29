# Development conventions

Apply these conventions when writing or reviewing code.

## Sizing

- When adding or reviewing layout size options (e.g. title height or label width), prefer `number | string`: numbers and `"px"` strings denote pixels; `"%"` strings are supported when there is a meaningful reference dimension. Document that dimension explicitly and reuse `calculateNumericProperty` from `src/core/utils/math.ts` to resolve values.
- Preserve existing field contracts, including CSS-valued text styles such as `fontSize`; do not apply this convention automatically to every numeric option.
