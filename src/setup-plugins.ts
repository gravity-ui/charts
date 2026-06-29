// Register all built-in series plugins so the registry is populated for every test.
// Core functions look series types up via the registry (getSeriesPlugin), which
// throws when it is empty — see the plugin registration gotcha.
import './plugins';
