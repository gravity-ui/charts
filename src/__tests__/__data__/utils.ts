import type {AreaSeries} from '../../types/chart/area';
import type {BarXSeries} from '../../types/chart/bar-x';
import type {LineSeries} from '../../types/chart/line';
import type {ScatterSeries} from '../../types/chart/scatter';

type DatetimeSeries = LineSeries | AreaSeries | BarXSeries | ScatterSeries;
type DatetimeSeriesOverrides = Partial<Omit<DatetimeSeries, 'type' | 'data'>>;

export function generateDatetimeSeries(args: {
    type: DatetimeSeries['type'];
    start: number | Date;
    end: number | Date;
    step: number;
    overrides?: DatetimeSeriesOverrides;
    generateY?: (timestamp: number, index: number) => number;
}): DatetimeSeries {
    const {type, start, end, step, overrides, generateY} = args;
    const startMs = typeof start === 'number' ? start : start.getTime();
    const endMs = typeof end === 'number' ? end : end.getTime();
    const data: {x: number; y: number}[] = [];
    let index = 0;

    for (let ts = startMs; ts <= endMs; ts += step) {
        const y = generateY ? generateY(ts, index) : Math.random() * 100;
        data.push({x: ts, y});
        index += 1;
    }

    return {
        type,
        name: overrides?.name ?? `Series ${type}`,
        data,
        ...overrides,
    } as DatetimeSeries;
}
