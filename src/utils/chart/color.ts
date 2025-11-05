import {range, scaleLinear} from 'd3';

import type {ChartData} from '../../types';

export function getDomainForContinuousColorScale(args: {
    series: ChartData['series']['data'];
}): number[] {
    const {series} = args;
    const values = series.reduce<number[]>((acc, s) => {
        switch (s.type) {
            case 'pie':
            case 'heatmap':
            case 'funnel': {
                acc.push(...s.data.map((d) => Number(d.value)));
                break;
            }
            case 'bar-y': {
                acc.push(...s.data.map((d) => Number(d.x)));
                break;
            }
            case 'scatter':
            case 'bar-x':
            case 'waterfall':
            case 'line':
            case 'area': {
                acc.push(...s.data.map((d) => Number(d.y)));
                break;
            }
            default: {
                throw Error(
                    `The method for calculation a domain for a continuous color scale for the "${s.type}" series is not defined`,
                );
            }
        }

        return acc;
    }, []);

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
