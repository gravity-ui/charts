import {i18n} from '~core/i18n';
import {getLabelsSize, getTextSizeFn} from '~core/utils';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {
    BarSeriesDataLabelPlacementOptions,
    BarSeriesDataLabelPlacementPosition,
    BaseTextStyle,
} from '../types';

const AUTO_POSITIONS: BarSeriesDataLabelPlacementPosition[] = ['outside', 'inside-end'];
const POSITIONS: BarSeriesDataLabelPlacementPosition[] = [...AUTO_POSITIONS, 'inside-center'];

/** Cache measurements for this preparation pass; resize and zoom get a fresh cache. */
export function createBarLabelMeasurer() {
    interface Size {
        width: number;
        height: number;
        hangingOffset: number;
    }
    const caches = {
        svg: new Map<BaseTextStyle, Map<string, Promise<Size>>>(),
        html: new Map<BaseTextStyle, Map<string, Promise<Size>>>(),
    };
    const svgMeasurers = new Map<BaseTextStyle, ReturnType<typeof getTextSizeFn>>();
    return (content: string, style: BaseTextStyle, html: boolean): Promise<Size> => {
        const cache = html ? caches.html : caches.svg;
        let sizes = cache.get(style);
        if (!sizes) {
            sizes = new Map();
            cache.set(style, sizes);
        }
        let size = sizes.get(content);
        if (!size) {
            if (html) {
                size = getLabelsSize({labels: [content], style, html}).then(
                    ({maxWidth, maxHeight}) => ({
                        width: maxWidth,
                        height: maxHeight,
                        hangingOffset: 0,
                    }),
                );
            } else {
                let measure = svgMeasurers.get(style);
                if (!measure) {
                    measure = getTextSizeFn({style});
                    svgMeasurers.set(style, measure);
                }
                size = measure(content);
            }
            sizes.set(content, size);
        }
        return size;
    };
}

export function validateBarLabelPlacement(options?: BarSeriesDataLabelPlacementOptions) {
    const {placement, placementFallback} = options ?? {};
    if (
        placement !== undefined &&
        placement !== 'auto' &&
        (!Array.isArray(placement) ||
            !placement.length ||
            !Array.from(placement).every((position) => POSITIONS.includes(position)))
    ) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'dataLabels.placement',
                values: 'auto or a nonempty array of outside, inside-end, inside-center',
            }),
        });
    }
    if (placementFallback !== undefined && !['show', 'hide'].includes(placementFallback)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-series-property', {
                key: 'dataLabels.placementFallback',
                values: 'show, hide',
            }),
        });
    }
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PlacementArgs {
    bar: Rect;
    plot: Rect;
    label: {width: number; height: number};
    /** The screen coordinate axis carrying the values. */
    valueAxis: 'x' | 'y';
    /** Whether the value end is at the larger screen coordinate. */
    endAtMax: boolean;
    padding: number;
    placement: NonNullable<BarSeriesDataLabelPlacementOptions['placement']>;
    placementFallback?: BarSeriesDataLabelPlacementOptions['placementFallback'];
}

function contains(outer: Rect, inner: Rect) {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

/** Resolve SVG and HTML labels using the same top-left label box. */
export function placeBarLabel(args: PlacementArgs): {x: number; y: number} | undefined {
    const {bar, plot, label, valueAxis, endAtMax, padding, placement, placementFallback} = args;
    const positions = placement === 'auto' ? AUTO_POSITIONS : placement;
    const horizontal = valueAxis === 'x';
    const visible: Rect = {
        x: Math.max(bar.x, plot.x),
        y: Math.max(bar.y, plot.y),
        width: 0,
        height: 0,
    };
    visible.width = Math.max(0, Math.min(bar.x + bar.width, plot.x + plot.width) - visible.x);
    visible.height = Math.max(0, Math.min(bar.y + bar.height, plot.y + plot.height) - visible.y);
    const visibleStart = horizontal ? visible.x : visible.y;
    const visibleSize = horizontal ? visible.width : visible.height;
    const labelSize = horizontal ? label.width : label.height;
    const barStart = horizontal ? bar.x : bar.y;
    const barSize = horizontal ? bar.width : bar.height;
    let first: Rect | undefined;

    for (const position of positions) {
        let along: number;
        if (position === 'outside') {
            along = endAtMax ? barStart + barSize + padding : barStart - padding - labelSize;
        } else if (position === 'inside-end') {
            along = endAtMax
                ? visibleStart + visibleSize - padding - labelSize
                : visibleStart + padding;
        } else {
            along = visibleStart + (visibleSize - labelSize) / 2;
        }
        const candidate: Rect = {
            ...label,
            x: horizontal ? along : visible.x + (visible.width - label.width) / 2,
            y: horizontal ? visible.y + (visible.height - label.height) / 2 : along,
        };
        first ??= candidate;
        const insideFits =
            position === 'outside' ||
            (contains(visible, candidate) &&
                along >= visibleStart + padding &&
                along + labelSize <= visibleStart + visibleSize - padding);
        if (bar.width >= 0 && bar.height >= 0 && contains(plot, candidate) && insideFits) {
            return {x: candidate.x, y: candidate.y};
        }
    }

    if (placementFallback === 'hide' || !first) return undefined;
    return {
        x: Math.max(plot.x, Math.min(first.x, plot.x + Math.max(0, plot.width - label.width))),
        y: Math.max(plot.y, Math.min(first.y, plot.y + Math.max(0, plot.height - label.height))),
    };
}
