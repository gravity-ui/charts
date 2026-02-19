import type {ChartAxisType} from '../../types';
import type {AreaSeries} from '../../types/chart/area';
import type {BarXSeries} from '../../types/chart/bar-x';
import type {BarYSeries} from '../../types/chart/bar-y';
import type {LineSeries} from '../../types/chart/line';
import type {ScatterSeries} from '../../types/chart/scatter';

type BaseSeries = LineSeries | AreaSeries | BarXSeries | BarYSeries | ScatterSeries;
type SeriesOverrides<T extends BaseSeries> = Partial<Omit<T, 'type' | 'data'>>;

export type GenerateSeriesOptions<T extends BaseSeries = BaseSeries> = {
    type: T['type'];
    xAxisType?: ChartAxisType;
    pointCount?: number;
    /** For datetime/linear: [start, end]. For category: unused. */
    xRange?: [number, number];
    /** For category: labels array. If not set, generates 'A', 'B', 'C'... */
    categories?: string[];
    /** Generate x value: (index) => number | string. Default: linear growth (index + 1). Ignored when xAxisType is datetime/category or categories is set. */
    generateX?: (index: number) => number | string;
    /** Generate y value: (x, index) => number. Default: linear growth (index + 1) */
    generateY?: (x: number | string, index: number) => number;
    overrides?: SeriesOverrides<T>;
};

function getXValues(opts: GenerateSeriesOptions): (number | string)[] {
    const {xAxisType = 'linear', pointCount = 10, xRange = [1, 10], categories} = opts;

    if (xAxisType === 'category') {
        if (categories?.length) {
            return categories;
        }

        return Array.from({length: pointCount}, (_, i) => String.fromCharCode(65 + i));
    }

    const [start, end] = xRange;
    const step = pointCount <= 1 ? 0 : (end - start) / (pointCount - 1);

    return Array.from({length: pointCount}, (_, i) => start + step * i);
}

const defaultLinear = (i: number) => i + 1;

export function generateSeriesData<T extends BaseSeries>(opts: GenerateSeriesOptions<T>): T {
    const {
        type,
        pointCount = 10,
        xAxisType,
        categories,
        generateX = defaultLinear,
        generateY = (_x: number | string, i: number) => i + 1,
        overrides,
    } = opts;

    const useBuiltInX = xAxisType === 'datetime' || xAxisType === 'category' || categories?.length;
    const xValues = useBuiltInX
        ? getXValues(opts)
        : Array.from({length: pointCount}, (_, i) => generateX(i));

    const data = xValues.map((x, index) => {
        const value = generateY(x, index);

        return type === 'bar-y' ? {y: x, x: value} : {x, y: value};
    });

    return {
        type,
        name: overrides?.name ?? `Series ${type}`,
        data,
        ...overrides,
    } as T;
}
