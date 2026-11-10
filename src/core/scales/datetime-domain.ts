/** Datetime limits clip the data extent, except when the extent contains only one point. */
export function getDatetimeDomain(
    [dataMin, dataMax]: [number, number],
    min?: number,
    max?: number,
): [number, number] {
    const isPointDomain = dataMin === dataMax;
    return [
        typeof min === 'number' && min > dataMin && !isPointDomain ? min : dataMin,
        typeof max === 'number' && max < dataMax && !isPointDomain ? max : dataMax,
    ];
}
