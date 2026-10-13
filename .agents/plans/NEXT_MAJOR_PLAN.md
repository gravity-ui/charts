# Next major release plan

This is a living record of public API changes intended for the next major release. Each entry links to the target contract, migration notes, and implementation scope. Entries are not release announcements.

## 1. Tooltip-independent chart interactions

Adopt `chart.events.click({targets, position, event, chart})` for all built-in series. Provide all exact hits in `targets` by default. Applications explicitly request nearest selection through `chart.getClosest(position, {mode: 'chart' | 'tooltip'})`. Geometry and selection policies belong to plugins; nearest queries compute only requested results.

- [Target contract and migration plan](CHART_INTERACTION_CONTRACT.md).
- Context: [issue #767](https://github.com/gravity-ui/charts/issues/767) and [PR #753](https://github.com/gravity-ui/charts/pull/753).

Before the major, introduce the query API and deprecate top-level `point`, `series`, and the second callback argument. Callback delivery becomes independent of tooltip candidate availability immediately, as agreed; legacy handlers must guard absent values. Keep their previous selection semantics during transition.

In the major, remove the deprecated fields and second argument. Consumers select a query explicitly and use the native `payload.event`. No tooltip renderer or configuration replacement is planned.

Keep this public API plan separate from the behavior-preserving [series plugin migration plan](SERIES_PLUGIN_MIGRATION_PLAN.md).
