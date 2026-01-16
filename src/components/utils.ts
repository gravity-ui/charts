import {duration} from '@gravity-ui/date-utils';
import {line as lineGenerator} from 'd3';
import {select} from 'd3-selection';

import type {DashStyle} from '../constants';
import type {ChartScaleLinear, ChartScaleTime} from '../hooks';
import type {ChartAxisRangeSlider} from '../types';
import {getLineDashArray, isTimeScale} from '../utils';

export function getInitialRangeSliderState(args: {
    xScale: ChartScaleLinear | ChartScaleTime;
    defaultRange?: ChartAxisRangeSlider['defaultRange'];
}) {
    const {defaultRange, xScale} = args;
    let minRange: number;
    let maxRange: number;

    if (isTimeScale(xScale)) {
        const [minDomainMs, maxDomainMs] = xScale.domain().map(Number);
        minRange = minDomainMs;
        maxRange = maxDomainMs;

        try {
            if (defaultRange?.size) {
                const durationMs = duration(defaultRange.size).asMilliseconds();
                const minDefaultRangeMs = maxDomainMs - durationMs;

                if (minDefaultRangeMs < maxDomainMs) {
                    minRange = minDefaultRangeMs;
                }
            }
        } catch {}
    } else {
        const [minDomain, maxDomain] = xScale.domain();
        minRange = minDomain;
        maxRange = maxDomain;

        if (typeof defaultRange?.size === 'number') {
            const minDefaultRange = maxDomain - defaultRange.size;
            if (minDefaultRange < maxDomain) {
                minRange = minDefaultRange;
            }
        }
    }

    return {min: minRange, max: maxRange};
}

const legendSymbolGenerator = lineGenerator<{x: number; y: number}>()
    .x((d) => d.x)
    .y((d) => d.y);

export function appendLinePathElement({
    svgRootElement,
    height,
    width,
    x = 0,
    lineWidth = 1,
    dashStyle,
    className,
    color,
}: {
    svgRootElement: SVGGElement | null;
    height: number;
    width: number;
    x?: number;
    lineWidth?: number;
    dashStyle?: DashStyle;
    className?: string;
    color?: string;
}) {
    const rootELementSelection = select(svgRootElement);

    const y = height / 2;
    const points = [
        {x, y},
        {x: x + width, y},
    ];

    const pathElement = rootELementSelection
        .append('path')
        .attr('d', legendSymbolGenerator(points))
        .attr('fill', 'none')
        .attr('stroke-width', lineWidth)
        .attr('stroke', color ?? '')
        .attr('class', className ?? null);

    if (dashStyle) {
        pathElement.attr('stroke-dasharray', getLineDashArray(dashStyle, lineWidth));
    }

    return rootELementSelection;
}
