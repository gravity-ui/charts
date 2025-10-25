import type {ChartScale, PreparedAxis, PreparedSeries} from '../../hooks';
import type {ChartSeries} from '../../types';
import {getDomainDataYBySeries, getMinSpaceBetween, getTicksCount, isBandScale} from '../../utils';

function thinOut<T>(items: T[], delta: number) {
    const arr: T[] = [];

    for (let i = 0; i < items.length; i = i + delta) {
        arr.push(items[i]);
    }

    return arr;
}

export function getTickValues({
    scale,
    axis,
    labelLineHeight,
    series,
}: {
    scale: ChartScale;
    axis: PreparedAxis;
    labelLineHeight: number;
    series: PreparedSeries[] | ChartSeries[];
}) {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const height = Math.abs(range[0] - range[1]);
        if (!height) {
            return [];
        }

        const getScaleTicks = () => {
            if (series.some((s) => s.type === 'bar-y')) {
                const domainData = getDomainDataYBySeries(series) as number[];

                if (domainData.length < 3) {
                    return domainData;
                }

                const ticksCount = getTicksCount({axis, range: height}) ?? domainData.length;
                return scale.ticks(Math.min(ticksCount, domainData.length));
            }

            const ticksCount = getTicksCount({axis, range: height});
            return scale.ticks(ticksCount);
        };

        const scaleTicks = getScaleTicks();
        let result = scaleTicks.map((t) => ({
            y: scale(t),
            value: t,
        }));

        if (result.length <= 1) {
            return result;
        }

        let labelHeight = getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
        let ticksCount = result.length - 1;
        while (labelHeight < labelLineHeight && result.length > 1) {
            ticksCount = ticksCount ? ticksCount - 1 : result.length - 1;
            result = scale.ticks(ticksCount).map((t) => ({
                y: scale(t),
                value: t,
            }));

            labelHeight = getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
        }

        return result;
    }

    if (isBandScale(scale)) {
        const domain = scale.domain();
        const bandWidth = scale.bandwidth();
        const items = domain.map((d) => ({
            y: (scale(d) ?? 0) + bandWidth / 2,
            value: d,
        }));

        if (items.length <= 1) {
            return items;
        }

        let result = [...items];
        let labelHeight = Math.abs(result[0].y - result[1].y) - axis.labels.padding * 2;
        let delta = 2;
        while (labelHeight < labelLineHeight && result.length > 1) {
            result = thinOut(items, delta);
            if (result.length > 1) {
                delta += 1;
                labelHeight = result[0].y - result[1].y - axis.labels.padding * 2;
            }
        }

        return result;
    }

    return [];
}
