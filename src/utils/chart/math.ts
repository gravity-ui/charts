import isNil from 'lodash/isNil';

const isStringValueInPercent = (value = '') => {
    return value.endsWith('%') && !Number.isNaN(Number.parseFloat(value));
};

const isStringValueInPixel = (value = '') => {
    return value.endsWith('px') && !Number.isNaN(Number.parseFloat(value));
};

/**
 * Calculates a numeric property based on the given arguments.
 *
 * @param {Object} args - The arguments for the calculation.
 * @param {string | number | null} args.value - The value to calculate the property for.
 * @param {number} args.base - The base value to use in the calculation.
 * @return {number | undefined} The calculated numeric property, or undefined if the value is invalid.
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
    const {value = '', base} = args;

    if (isNil(value)) {
        return undefined;
    }

    if (typeof value === 'string') {
        if (isStringValueInPercent(value) && typeof base === 'number') {
            const fraction = Number.parseFloat(value) / 100;
            return base * fraction;
        }

        if (isStringValueInPixel(value)) {
            return Number.parseFloat(value);
        }

        return undefined;
    }

    return value;
};

export function calculateCos(deg: number, precision = 2) {
    const factor = Math.pow(10, precision);
    return Math.floor(Math.cos((Math.PI / 180) * deg) * factor) / factor;
}

export function calculateSin(deg: number, precision = 2) {
    const factor = Math.pow(10, precision);
    return Math.floor(Math.sin((Math.PI / 180) * deg) * factor) / factor;
}
