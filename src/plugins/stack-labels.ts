import {select} from 'd3-selection';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import type {PreparedSplit} from '~core/layout/split-types';
import {renderDataLabels} from '~core/shapes/data-labels';
import type {LabelRect, ShapeLabels, SvgLabel} from '~core/shapes/types';
import {
    filterOverlappingLabels,
    getHtmlLabelConstraintedPosition,
    getLabelRect,
    getLayerLabelRects,
} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';
import {getMultilineTextInfo, getTextSizeFn} from '~core/utils/text';

import type {BaseTextStyle, StackLabelsOptions} from '../types';

// Prepared geometry may be rounded to hundredths of a pixel while plot bounds are not.
const COORDINATE_EPSILON = 0.01;

export interface StackLabelAnchor {
    options?: StackLabelsOptions;
    x: number;
    y: number;
    total: number;
    direction: 'top' | 'bottom' | 'left' | 'right';
    plotIndex: number;
}

interface StackLabelCandidate extends LabelRect {
    label: SvgLabel;
    allowOverlap: boolean;
}

interface StackLabelMeasurementContext {
    style: BaseTextStyle;
    measure: ReturnType<typeof getTextSizeFn>;
    measurements: Map<string, ReturnType<typeof getMultilineTextInfo>>;
}

export async function prepareStackLabels(args: {
    anchors: StackLabelAnchor[];
    options?: StackLabelsOptions;
    boundsWidth: number;
    boundsHeight: number;
    split?: PreparedSplit;
    otherLayers?: ShapeLabels[];
    isRangeSlider?: boolean;
}): Promise<SvgLabel[]> {
    const {anchors, boundsWidth, boundsHeight, split, otherLayers = [], isRangeSlider} = args;
    const defaultOptions = args.options ?? {};
    if (isRangeSlider || !anchors.length) {
        return [];
    }

    // Share measurements across stacks with identical styles, outside the point loop.
    const contextsByStyle = new Map<string, StackLabelMeasurementContext>();
    const contexts = new Map(
        [...new Set(anchors.map((anchor) => anchor.options ?? defaultOptions))].map((options) => {
            const style = {...DEFAULT_DATALABELS_STYLE, ...options.style};
            const key = JSON.stringify(
                Object.entries(style).sort(([a], [b]) => a.localeCompare(b)),
            );
            let context = contextsByStyle.get(key);
            if (!context) {
                context = {style, measure: getTextSizeFn({style}), measurements: new Map()};
                contextsByStyle.set(key, context);
            }
            return [options, context] as const;
        }),
    );
    const obstacles = getLayerLabelRects(otherLayers);
    const candidates: StackLabelCandidate[] = [];

    for (const anchor of anchors) {
        const options = anchor.options ?? defaultOptions;
        if (!options.enabled) continue;
        const context = contexts.get(options);
        if (!context) continue;
        const {style, measure, measurements} = context;
        const padding = options.padding ?? 5;
        const plot = split?.plots[anchor.plotIndex];
        const top = plot?.top ?? 0;
        const height = plot?.height ?? boundsHeight;
        // Do not move totals of clipped stacks into the viewport when zooming.
        if (
            !Number.isFinite(anchor.total) ||
            !Number.isFinite(anchor.x) ||
            !Number.isFinite(anchor.y) ||
            anchor.x < -COORDINATE_EPSILON ||
            anchor.x > boundsWidth + COORDINATE_EPSILON ||
            anchor.y < top - COORDINATE_EPSILON ||
            anchor.y > top + height + COORDINATE_EPSILON
        ) {
            continue;
        }

        const text = getFormattedValue({value: anchor.total, format: options.format});
        if (!text) {
            continue;
        }
        let measurement = measurements.get(text);
        if (!measurement) {
            measurement = getMultilineTextInfo({text, getTextSize: measure});
            measurements.set(text, measurement);
        }
        const size = await measurement;
        if (size.width > boundsWidth || size.height > height) {
            continue;
        }
        let x = anchor.x - size.width / 2;
        let y = anchor.y - top - size.height / 2;
        switch (anchor.direction) {
            case 'top':
                y = anchor.y - top - size.height - padding;
                break;
            case 'bottom':
                y = anchor.y - top + padding;
                break;
            case 'left':
                x = anchor.x - size.width - padding;
                break;
            case 'right':
                x = anchor.x + padding;
                break;
        }
        const position = getHtmlLabelConstraintedPosition({
            boundsWidth,
            boundsHeight: height,
            width: size.width,
            height: size.height,
            x,
            y,
        });
        const label: SvgLabel = {
            text,
            lines: size.lines.length > 1 ? size.lines : undefined,
            lineHeight: size.lineHeight,
            x: position.x,
            y: position.y + top + size.hangingOffset,
            size,
            style,
            textAnchor: 'start',
        };
        candidates.push({
            ...getLabelRect(label),
            label,
            allowOverlap: options.allowOverlap ?? false,
        });
    }

    const overlapping = candidates.filter((candidate) => candidate.allowOverlap);
    const filtered = filterOverlappingLabels(
        candidates.filter((candidate) => !candidate.allowOverlap),
        [...obstacles, ...overlapping],
    );
    return [...overlapping, ...filtered].map((candidate) => candidate.label);
}

export function renderStackLabels(plot: SVGGElement, labels: SvgLabel[] = []) {
    if (!labels.length) return;
    // Keep a separate selection: renderDataLabels joins every text node in its container.
    const container = select(plot).append('g').attr('class', 'gcharts-stack-labels');
    const selection = renderDataLabels({
        container,
        data: labels,
        className: 'gcharts-stack-labels__label',
    })
        .style('dominant-baseline', 'hanging')
        .style('pointer-events', 'none')
        .style('user-select', 'none');
    // WebKit resets the baseline on nested tspans unless it is set explicitly.
    selection.selectAll('tspan').style('dominant-baseline', 'hanging');
}
