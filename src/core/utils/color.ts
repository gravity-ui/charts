import {range} from 'd3-array';
import {scaleLinear} from 'd3-scale';

import type {ChartData} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';

export function getDomainForContinuousColorScale(args: {
    series: ChartData['series']['data'];
}): number[] {
    const {series} = args;
    const values = series.flatMap((s) => {
        const {getColorValue} = getSeriesPlugin(s.type);

        if (!getColorValue) {
            throw Error(
                `The method for calculation a domain for a continuous color scale for the "${s.type}" series is not defined`,
            );
        }

        return s.data.map((d) => Number(getColorValue(d)));
    });

    return [Math.min(...values), Math.max(...values)];
}

export function getDefaultColorStops(size: number) {
    return range(size).map((d) => d / size);
}

export function getContinuesColorFn(args: {values: number[]; colors: string[]; stops?: number[]}) {
    const {values, colors, stops: customStops} = args;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stops = customStops ?? getDefaultColorStops(colors.length);
    const color = scaleLinear(stops, colors);

    return (value: number) => {
        const colorValue = (value - min) / (max - min);
        return color(colorValue);
    };
}
