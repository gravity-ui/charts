import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {SeriesPluginZoomOptions} from '~core/series/plugin';
import type {PreparedLineSeries} from '~core/series/types';

import type {ChartXAxis, ChartYAxis, LineSeries, LineSeriesData} from '../../types';

interface Point {
    x: number;
    y: number;
}

interface Args {
    series: Pick<LineSeries, 'data' | 'interpolation'>;
    xRange: [number, number];
    xAxis?: ChartXAxis | PreparedXAxis | null;
    yAxis?: ChartYAxis | PreparedYAxis;
}

export function prepareLineAxisSeries(
    args: Parameters<NonNullable<SeriesPluginZoomOptions<LineSeries>['prepareAxisSeries']>>[0],
): PreparedLineSeries {
    const axisDomainData = getLineDomainData({...args, series: args.shapeSeries});
    return axisDomainData ? {...args.series, axisDomainData} : args.series;
}

/** Domain-only vertices of the line clipped to the visible X range. */
export function getLineDomainData({
    series,
    xRange,
    xAxis,
    yAxis,
}: Args): LineSeriesData[] | undefined {
    const interpolation = series.interpolation;
    if (
        xAxis?.type === 'category' ||
        yAxis?.type === 'category' ||
        (interpolation && interpolation.type !== 'linear' && interpolation.type !== 'step')
    ) {
        return undefined;
    }

    // Interpolation is performed in axis space, as it is when rendering on log axes.
    const projectX = xAxis?.type === 'logarithmic' ? (x: number) => Math.log(x) : (x: number) => x;
    const projectY = yAxis?.type === 'logarithmic' ? (y: number) => Math.log(y) : (y: number) => y;
    const invertX = xAxis?.type === 'logarithmic' ? (x: number) => Math.exp(x) : (x: number) => x;
    const invertY = yAxis?.type === 'logarithmic' ? (y: number) => Math.exp(y) : (y: number) => y;
    const min = projectX(xRange[0]);
    const max = projectX(xRange[1]);
    const data: LineSeriesData[] = [];
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return data;

    const append = (x: number, y: number) => data.push({x: invertX(x), y: invertY(y)});
    const appendSegment = (from: Point, to: Point) => {
        if (Math.max(from.x, to.x) < min || Math.min(from.x, to.x) > max) return;
        if (from.x === to.x) {
            append(from.x, from.y);
            append(to.x, to.y);
            return;
        }
        const a = (min - from.x) / (to.x - from.x);
        const b = (max - from.x) / (to.x - from.x);
        const start = Math.max(0, Math.min(a, b));
        const end = Math.min(1, Math.max(a, b));
        for (const t of [start, end]) {
            append(from.x + t * (to.x - from.x), from.y + t * (to.y - from.y));
        }
    };

    let previous: Point | undefined;
    for (const point of series.data) {
        const x = point.x === undefined ? NaN : projectX(Number(point.x));
        const y = point.y === null || point.y === undefined ? NaN : projectY(Number(point.y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            previous = undefined;
            continue;
        }
        const current = {x, y};
        if (x >= min && x <= max) data.push(point);
        if (previous) {
            if (interpolation?.type === 'step') {
                let transitionX = x;
                if (interpolation.position === 'middle') {
                    transitionX = (previous.x + x) / 2;
                } else if (interpolation.position === 'before') {
                    transitionX = previous.x;
                }
                const before = {x: transitionX, y: previous.y};
                const after = {x: transitionX, y};
                appendSegment(previous, before);
                appendSegment(before, after);
                appendSegment(after, current);
            } else {
                appendSegment(previous, current);
            }
        }
        previous = current;
    }
    return data;
}
