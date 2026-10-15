import {range} from 'd3-array';
import {color as parseColor} from 'd3-color';
import {scaleLinear} from 'd3-scale';

import type {ChartData} from '../../types';
import {getSeriesPlugin} from '../series/seriesRegistry';

let colorContext: CanvasRenderingContext2D | null | undefined;

/** Whether a literal CSS color paints any pixels. Unresolved colors remain visible. */
export function isColorVisible(value: string | undefined): boolean {
    if (!value || value.trim().toLowerCase() === 'none') return false;
    const parsed = parseColor(value);
    if (parsed) return parsed.opacity > 0;

    // D3 does not parse modern CSS colors such as rgb(0 0 0 / 0) or color(display-p3 ...).
    if (colorContext === undefined && typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        colorContext = canvas.getContext('2d', {willReadFrequently: true});
    }
    if (!colorContext) return true;

    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = '#000';
    colorContext.fillStyle = value;
    colorContext.fillRect(0, 0, 1, 1);
    return colorContext.getImageData(0, 0, 1, 1).data[3] > 0;
}

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
