# TypeScript conventions

- Use `interface` instead of `type` for object shape declarations where possible. Fall back to `type` only when necessary (unions, intersections, mapped types, primitives, tuples).

# Plugin architecture

- Series-specific behavior must live in the plugin, not in shared hooks or utilities. Never add a hardcoded `Set`, `switch`, or constant keyed on series type string in shared code — add a field to `SeriesPlugin` and let each plugin declare its own behavior.
