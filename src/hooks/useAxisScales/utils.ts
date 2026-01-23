import get from 'lodash/get';

import {SERIES_TYPE} from '../../constants';
import type {SeriesType} from '../../constants';
import type {PreparedAxis, PreparedSeries, PreparedYAxis} from '../../hooks';
import type {ChartAxis, ChartSeries} from '../../types';
import {getDataCategoryValue, isSeriesWithCategoryValues} from '../../utils';
import type {AxisDirection} from '../../utils';

const MARKER_SERIES_TYPES: SeriesType[] = [SERIES_TYPE.Area, SERIES_TYPE.Line, SERIES_TYPE.Scatter];

type OptionalNumber = number | undefined;

function getNormilizedMinMax(args: {
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): OptionalNumber[] {
    const {maxValues, minValues} = args;
    const filteredMaxValues = maxValues.filter((v) => typeof v === 'number');
    const filteredMinValues = minValues.filter((v) => typeof v === 'number');
    const max = filteredMaxValues.length ? Math.max(...filteredMaxValues) : undefined;
    const min = filteredMinValues.length ? Math.min(...filteredMinValues) : undefined;

    return [min, max];
}

export function getMinMaxPropsOrState(args: {
    axis: PreparedAxis | ChartAxis;
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): [OptionalNumber, OptionalNumber] {
    const {axis, maxValues, minValues} = args;
    const minProps = get(axis, 'min');
    const maxProps = get(axis, 'max');
    const [minState, maxState] = getNormilizedMinMax({maxValues, minValues});
    const min = minState ?? minProps;
    const max = maxState ?? maxProps;

    return [min, max];
}

/**
 * Checks whether a domain represents a single point (when minimum and maximum values are equal).
 *
 * This is necessary for cases where exactly one marker needs to be rendered on an axis.
 * In such cases, it is not allowed to use axis extremums (min/max)
 * that differ from those in the domain, as this can lead to incorrect visualization
 * and scale stretching around a single point.
 */
export function checkIsPointDomain(domain: [number, number]) {
    return domain[0] === domain[1];
}

export function hasOnlyMarkerSeries(series: (PreparedSeries | ChartSeries)[]): boolean {
    return series.every((s) => MARKER_SERIES_TYPES.includes(s.type));
}

export function clusterYAxes(yAxes: PreparedYAxis[]): [PreparedYAxis, PreparedYAxis?][] {
    if (yAxes.length <= 1) {
        return yAxes.map((axis) => [axis]);
    }

    const clusters: Record<number, PreparedYAxis[]> = {};
    yAxes.forEach((axis) => {
        const plotIndex = axis.plotIndex ?? 0;
        if (!clusters[plotIndex]) {
            clusters[plotIndex] = [];
        }
        clusters[plotIndex].push(axis);
    });

    return Object.values(clusters).map((cluster) => {
        if (cluster.length <= 1) {
            return [cluster[0]];
        }

        const leftAxis = cluster.find((a) => a.position === 'left');
        const secondaryAxis = cluster.find((a) => a !== leftAxis);

        if (leftAxis) {
            return [leftAxis, secondaryAxis];
        }

        return [cluster[0], cluster[1]];
    });
}

export function validateArrayData(data: unknown[]) {
    let hasNumberAndNullValues: boolean | undefined;
    let hasOnlyNullValues: boolean | undefined;

    for (const d of data) {
        const isNumber = typeof d === 'number';
        const isNull = d === null;
        hasNumberAndNullValues =
            typeof hasNumberAndNullValues === 'undefined'
                ? isNumber || isNull
                : hasNumberAndNullValues && (isNumber || isNull);
        hasOnlyNullValues =
            typeof hasOnlyNullValues === 'undefined' ? isNull : hasOnlyNullValues && isNull;

        if (!hasNumberAndNullValues) {
            break;
        }
    }

    return {hasNumberAndNullValues, hasOnlyNullValues};
}

export function filterCategoriesByVisibleSeries(args: {
    axisDirection: AxisDirection;
    categories: string[];
    series: (PreparedSeries | ChartSeries)[];
}) {
    const {axisDirection, categories, series} = args;

    const visibleCategories = new Set();
    series.forEach((s) => {
        if (isSeriesWithCategoryValues(s)) {
            s.data.forEach((d) => {
                visibleCategories.add(getDataCategoryValue({axisDirection, categories, data: d}));
            });
        }
    });
    const filteredCategories = categories.filter((c) => visibleCategories.has(c));

    return filteredCategories.length > 0 ? filteredCategories : categories;
}
