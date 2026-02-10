import type {ChartScale, PreparedAxis, PreparedSeries} from '../../../hooks';
import type {ChartSeries} from '../../../types';
import {getMinSpaceBetween} from '../array';
import {isSeriesWithNumericalXValues} from '../series-type-guards';

import {getTicksCountByPixelInterval, isBandScale, thinOut} from './common';

const DEFAULT_TICKS_COUNT = 10;

type TickValue = {x: number; value: number | string | Date};

function getTicksCount(args: {
    axis: PreparedAxis;
    axisWidth: number;
    series?: ChartSeries[] | PreparedSeries[];
}) {
    const {axis, axisWidth, series} = args;
    const result = getTicksCountByPixelInterval({axis, axisWidth});

    if (typeof result === 'number') {
        return result;
    }

    if (series) {
        const xDataSet = new Set<number | string>();
        series?.forEach((item) => {
            if (isSeriesWithNumericalXValues(item)) {
                item.data.forEach((data) => {
                    xDataSet.add(data.x);
                });
            }
        });

        return xDataSet.size < DEFAULT_TICKS_COUNT ? xDataSet.size : DEFAULT_TICKS_COUNT;
    }

    return DEFAULT_TICKS_COUNT;
}

export function getXAxisTickValues({
    axis,
    labelLineHeight,
    scale,
    series,
}: {
    axis: PreparedAxis;
    labelLineHeight: number;
    scale: ChartScale;
    series?: ChartSeries[] | PreparedSeries[];
}): TickValue[] {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const axisWidth = Math.abs(range[0] - range[1]);
        if (!axisWidth) {
            return [];
        }

        const scaleTicksCount = getTicksCount({axis, axisWidth, series});
        const scaleTicks = scale.ticks(scaleTicksCount);

        const originalTickValues = scaleTicks.map((t) => ({
            x: scale(t),
            value: t,
        }));

        if (originalTickValues.length <= 1) {
            return originalTickValues;
        }

        // first, we try to draw "beautiful" tick values
        let result = originalTickValues;
        let availableSpaceForLabel =
            getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
        let ticksCount = result.length - 1;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            ticksCount = ticksCount ? ticksCount - 1 : result.length - 1;
            const newScaleTicks = scale.ticks(ticksCount);
            result = newScaleTicks.map((t) => ({
                x: scale(t),
                value: t,
            }));

            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
        }

        // when this is not possible (for example, such values cannot be selected for the logarithmic axis with a small range)
        // just thin out the originally proposed result
        if (!result.length) {
            result = originalTickValues;
            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
            let delta = 2;
            while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
                result = thinOut(result, delta);
                if (result.length > 1) {
                    delta += 1;
                    availableSpaceForLabel =
                        getMinSpaceBetween(result, (d) => d.x) - axis.labels.padding * 2;
                }
            }
        }

        return result;
    }

    if (isBandScale(scale)) {
        const domain = scale.domain();
        const bandWidth = scale.bandwidth();
        const items = domain.map((d) => ({
            x: (scale(d) ?? 0) + bandWidth / 2,
            value: d,
        }));

        if (items.length <= 1) {
            return items;
        }

        let result = [...items];
        let availableSpaceForLabel = Math.abs(result[0].x - result[1].x) - axis.labels.padding * 2;
        let delta = 2;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            result = thinOut(items, delta);
            if (result.length > 1) {
                delta += 1;
                availableSpaceForLabel =
                    Math.abs(result[0].x - result[1].x) - axis.labels.padding * 2;
            }
        }

        return result;
    }

    return [];
}
