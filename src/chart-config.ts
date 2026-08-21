import type {ChartData} from './core/types';

type JsonPrimitive = boolean | null | number | string;

type JsonValue = JsonPrimitive | JsonValue[] | {[key: string]: JsonValue};

/**
 * A chart configuration used to generate the published Monaco declaration bundle and JSON Schema.
 *
 * Callback functions remain available in TypeScript declarations. The artifact build omits them
 * from JSON Schema because JSON cannot represent them.
 */
export interface ChartConfig extends ChartData<JsonValue> {}
