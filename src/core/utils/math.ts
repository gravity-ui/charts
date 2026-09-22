import isNil from 'lodash/isNil';

function shiftDecimal(value: number, places: number): number {
    const [coefficient, exponent = '0'] = String(value).split('e');
    return Number(`${coefficient}e${Number(exponent) + places}`);
}

/** Sum decimal values as safe integers; use native addition outside that range. */
export function sumDecimals(values: readonly number[]): number {
    const precision = values.reduce((max, value) => {
        const [coefficient, exponent = '0'] = String(value).split('e');
        return Math.max(max, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent));
    }, 0);

    let total = 0;
    for (const value of values) {
        // Exponent shifts avoid rounding from multiplication by powers of ten.
        const scaled = shiftDecimal(value, precision);
        const next = total + scaled;
        if (!Number.isSafeInteger(scaled) || !Number.isSafeInteger(next)) {
            return values.reduce((sum, item) => sum + item, 0);
        }
        total = next;
    }

    return shiftDecimal(total, -precision);
}

interface ParsedNumericProperty {
    value: number;
    unit: 'px' | '%';
}

/**
 * Parses numeric values and units without scaling percentages.
 * Preserves numeric prefixes and numeric NaN/Infinity for compatibility.
 * Callers requiring strict validation must check format and finiteness (see parseLegendWidth).
 */
export function parseNumericProperty(
    value?: string | number | null,
): ParsedNumericProperty | undefined {
    if (isNil(value)) {
        return undefined;
    }

    if (typeof value === 'number') {
        return {value, unit: 'px'};
    }

    let unit: ParsedNumericProperty['unit'];
    if (value.endsWith('%')) {
        unit = '%';
    } else if (value.endsWith('px')) {
        unit = 'px';
    } else {
        return undefined;
    }

    // TODO: Enforce strict formats and finite values after a compatibility audit.
    // Preserve signed coordinates and offsets: https://github.com/gravity-ui/charts/issues/702
    const parsedValue = Number.parseFloat(value);
    return Number.isNaN(parsedValue) ? undefined : {value: parsedValue, unit};
}

/**
 * Calculates a numeric property based on the given arguments.
 * Uses permissive parsing; see parseNumericProperty for validation limits.
 * @param {object} args - The arguments for the calculation.
 * @param {string | number | null} args.value - The value to calculate the property for.
 * @param {number} args.base - The base value to use in the calculation.
 * @returns {number | undefined} The calculated numeric property, or undefined if the value is invalid.
 * @example
 * const result1 = calculateNumericProperty({value: 1});
 * console.log(result1); // Output: 1
 * const result2 = calculateNumericProperty({value: '10px'});
 * console.log(result2); // Output: 10
 * const result3 = calculateNumericProperty({value: '50%', base: 200});
 * console.log(result3); // Output: 100
 * const result4 = calculateNumericProperty({value: '50%'});
 * console.log(result4); // Output: undefined
 * const result5 = calculateNumericProperty({value: 'invalid_value'});
 * console.log(result5); // Output: undefined
 */
export const calculateNumericProperty = (args: {value?: string | number | null; base?: number}) => {
    const {base} = args;
    const parsed = parseNumericProperty(args.value);
    if (!parsed) {
        return undefined;
    }

    if (parsed.unit === '%') {
        return typeof base === 'number' ? base * (parsed.value / 100) : undefined;
    }

    return parsed.value;
};

export function calculateCos(deg: number, precision = 2) {
    const factor = Math.pow(10, precision);
    return Math.floor(Math.cos((Math.PI / 180) * deg) * factor) / factor;
}

export function calculateSin(deg: number, precision = 2) {
    const factor = Math.pow(10, precision);
    return Math.floor(Math.sin((Math.PI / 180) * deg) * factor) / factor;
}
