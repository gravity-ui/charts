# Next major release plan

Planned breaking changes and migration notes for the next major release.

## Chart click events

Change the default `chart.events.clickMode` from `'tooltip'` to `'plot'`. Remove deprecated `point`, `series`, and the second argument from both click modes, along with `ChartLegacyClickData`; use the clean `ChartClickData` contract with required modern fields for both modes. Until this major release, keep a single compatible callback signature independent of clickMode, including for wrappers that spread events and replace the handler or forward only `{point, series}`. Modern fields remain optional in that signature to support such forwarding. Handlers using explicit `'plot'` and only the fields of `ChartClickData` are ready for the new contract. Preserve explicit `'tooltip'` as a delivery filter. Use `targets[0]` for an exact hit, or `chart.getClosest(position, {mode: 'tooltip'})` for the previous selection policy; handle a missing result. Read the native event from `payload.event`. See the [migration example](../../docs/diplodoc/pages/guides/chart-interactions.md#migrating-click-handlers).
