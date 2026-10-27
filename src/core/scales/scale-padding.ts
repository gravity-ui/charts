import {group} from 'd3-array';

import type {PrepareShapeDataArgs} from '../series/plugin';
import {getSeriesPlugin} from '../series/seriesRegistry';
import {getOnlyVisibleSeries} from '../utils';

import type {ChartScale} from './types';

const COORDINATE_EPSILON = 0.01;

/** Space required around a projected point without changing the axis domain. */
export interface ScalePaddingPoint {
    axis: 'x' | 'y';
    plotIndex: number;
    position: number;
    before: number;
    after: number;
}

function insetScale(scale: ChartScale, points: ScalePaddingPoint[]) {
    if (!('invert' in scale) || !points.length) return;

    const range = scale.range();
    const start = Math.min(...range);
    const span = Math.max(...range) - start;
    if (!Number.isFinite(span) || span <= 1) return;

    const constraints = points.filter(
        (point) =>
            Number.isFinite(point.position) &&
            point.position >= start - COORDINATE_EPSILON &&
            point.position <= start + span + COORDINATE_EPSILON &&
            point.before + point.after < span,
    );
    let before = 0;
    let after = 0;

    for (let iteration = 0; iteration < 32; iteration++) {
        let nextBefore = before;
        let nextAfter = after;

        for (const point of constraints) {
            const fraction = Math.max(0, Math.min(1, (point.position - start) / span));
            if (fraction < 1) {
                nextBefore = Math.max(
                    nextBefore,
                    (point.before - fraction * span + after * fraction) / (1 - fraction),
                );
            }
            if (fraction > 0) {
                nextAfter = Math.max(
                    nextAfter,
                    (point.after - (1 - fraction) * span + before * (1 - fraction)) / fraction,
                );
            }
        }

        // Keep the original scale when the labels leave no usable space for data.
        if (nextBefore + nextAfter >= span - 1) return;

        const delta = nextBefore - before + nextAfter - after;
        before = nextBefore;
        after = nextAfter;
        if (delta < 1e-7) break;
    }

    scale.range(
        range.map((value) => start + before + ((value - start) / span) * (span - before - after)),
    );
}

export async function applyScalePadding(args: PrepareShapeDataArgs) {
    if (args.isRangeSlider) return;

    const points: ScalePaddingPoint[] = [];
    for (const [type, series] of group(getOnlyVisibleSeries(args.series), (item) => item.type)) {
        const padding = await getSeriesPlugin(type).getScalePadding?.({...args, series});
        if (padding) points.push(...padding);
    }

    if (args.xScale)
        insetScale(
            args.xScale,
            points.filter((point) => point.axis === 'x'),
        );

    args.yScale?.forEach((scale, index) => {
        if (!scale) return;

        const plotIndex = args.yAxis?.[index]?.plotIndex ?? 0;
        insetScale(
            scale,
            points.filter((point) => point.axis === 'y' && point.plotIndex === plotIndex),
        );
    });
}
