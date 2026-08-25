import type {ChartData} from '~core/types';

type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonPrimitive | JsonValue[] | {[key: string]: JsonValue};

/**
 * JSON-serializable chart configuration.
 *
 * Covers all options that can be expressed without executable code. Callback-based options
 * (event handlers, custom formatters, renderers) are available via `ChartData` when working
 * directly with the React component.
 */
export interface ChartConfig extends ChartData<JsonValue> {}
