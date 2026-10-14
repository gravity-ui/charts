# Next major release plan

Planned breaking changes and migration notes for the next major release.

## Chart click events

Remove deprecated `point`, `series`, and the second argument of `chart.events.click`. Use `targets[0]` for an exact hit, or `chart.getClosest(position, {mode: 'tooltip'})` for the previous selection policy; handle a missing result. Read the native event from `payload.event`. See the [migration example](../../docs/diplodoc/pages/guides/chart-interactions.md#migrating-click-handlers).
