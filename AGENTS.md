# TypeScript conventions

- Use `interface` instead of `type` for object shape declarations where possible. Fall back to `type` only when necessary (unions, intersections, mapped types, primitives, tuples).

# Plugin architecture

- Series-specific behavior must live in the plugin, not in shared hooks or utilities. Never add a hardcoded `Set`, `switch`, or constant keyed on series type string in shared code — add a field to `SeriesPlugin` and let each plugin declare its own behavior.

# Config / type hierarchy

- `BaseDataLabels` and `BaseSeries` feed the public chart config. Any field added there is immediately visible and settable for **all** series types. Only add a field to `Base*` when it is implemented for all series. For a feature that is only supported by one (or a few) plugins, add it directly to that series' type (e.g. `FunnelSeries.dataLabels`). Move it to `Base*` later once every plugin supports it.
