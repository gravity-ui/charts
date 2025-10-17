import type {ChartScale, PreparedAxis} from '../../hooks';
import {getTicksCount, isBandScale} from '../../utils';

function thinOut<T>(items: T[], delta: number) {
    const arr: T[] = [];

    for (let i = 0; i < items.length; i = i + delta) {
        arr.push(items[i]);
    }

    return arr;
}
function getMinSpaceBetween<T>(arr: T[], iterator: (item: T) => number) {
    return arr.reduce((acc, item, index) => {
        const prev = arr[index - 1];
        if (prev) {
            return Math.min(acc, Math.abs(iterator(prev) - iterator(item)));
        }
        return acc;
    }, Infinity);
}

export function getTickValues({
    scale,
    axis,
    labelLineHeight,
}: {
    scale: ChartScale;
    axis: PreparedAxis;
    labelLineHeight: number;
}) {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const height = Math.abs(range[0] - range[1]);
        if (!height) {
            return [];
        }

        let ticksCount = getTicksCount({axis, range: height});
        let result = scale.ticks(ticksCount).map((t) => ({
            y: scale(t),
            value: t,
        }));

        if (result.length <= 1) {
            return result;
        }

        let labelHeight = getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
        ticksCount = result.length - 1;
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
        let labelHeight = result[0].y - result[1].y - axis.labels.padding * 2;
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
