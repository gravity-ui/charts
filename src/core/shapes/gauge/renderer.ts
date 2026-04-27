import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';

import {block} from '../../../utils';

import type {PreparedGaugeData, ThresholdArc} from './types';
import {buildArcPath, fitFontSize, pointOnArc} from './utils';

const b = block('gauge');

export function renderGauge(
    elements: {plot: SVGGElement},
    preparedData: PreparedGaugeData[],
    dispatcher?: Dispatch<object>,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();

    preparedData.forEach((d) => renderOne(svgElement.append('g'), d));

    return () => {
        dispatcher?.on('hover-shape.gauge', null);
    };
}

function renderOne(g: ReturnType<typeof select<SVGGElement, unknown>>, d: PreparedGaugeData) {
    const {cx, cy, outerRadius, innerRadius, startAngleDeg, endAngleDeg, series} = d;
    const {arc, pointer} = series;
    const cornerRadius = arc.cornerRadius;

    // 1. Background track — full arc, rounded caps
    g.append('path')
        .attr('class', b('track'))
        .attr('transform', `translate(${cx},${cy})`)
        .attr(
            'd',
            buildArcPath({
                innerRadius,
                outerRadius,
                startDeg: startAngleDeg,
                endDeg: endAngleDeg,
                cornerRadius,
            }),
        )
        .attr('fill', 'currentColor')
        .attr('opacity', 0.1);

    // 2. Threshold arcs / filled track — skipped for solid pointer (background track handles the "empty" visual)
    if (pointer.type !== 'solid') {
        if (arc.trackStyle === 'continuous') {
            renderContinuousTrack(g, d);
        } else {
            renderDiscreteArcs(g, d);
        }
    }

    // 3. Pointer
    const pointerColor = pointer.color ?? series.color;
    switch (pointer.type) {
        case 'needle': {
            // Line from deep inside the center (20% of innerRadius) to just past the outer edge.
            // Extending inward past innerRadius makes it visually distinct from the marker tick.
            const overhang = 5;
            const [x1, y1] = pointOnArc(cx, cy, innerRadius * 0.2, d.valueAngleDeg);
            const [x2, y2] = pointOnArc(cx, cy, outerRadius + overhang, d.valueAngleDeg);
            g.append('line')
                .attr('class', b('needle'))
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('stroke', pointerColor)
                .attr('stroke-width', 2)
                .attr('stroke-linecap', 'round');
            break;
        }
        case 'solid': {
            // Solid arc from startAngle to valueAngle, rounded caps
            g.append('path')
                .attr('class', b('solid'))
                .attr('transform', `translate(${cx},${cy})`)
                .attr(
                    'd',
                    buildArcPath({
                        innerRadius,
                        outerRadius,
                        startDeg: startAngleDeg,
                        endDeg: d.valueAngleDeg,
                        cornerRadius,
                    }),
                )
                .attr('fill', pointerColor);
            break;
        }
        default: {
            // Marker: a tick line that extends slightly beyond arc edges
            renderTickMarker(g, d, pointerColor);
            break;
        }
    }

    // 4. Target line — a tick across the arc at the target value
    if (d.targetAngleDeg !== undefined) {
        renderTargetLine(g, d);
    }

    // 5. Center text (value + unit) — only if no custom inner content
    if (!series.customContent?.inner) {
        renderCenterText(g, d);
    }

    // 6. Overflow badge
    if (series.overflow === 'clamp' && series.value > series.max) {
        const [bx, by] = pointOnArc(cx, cy, outerRadius, 0);
        const badgeG = g.append('g').attr('class', b('overflow-badge'));
        badgeG
            .append('rect')
            .attr('x', bx - 20)
            .attr('y', by + 4)
            .attr('width', 40)
            .attr('height', 16)
            .attr('rx', 8)
            .attr('fill', series.color)
            .attr('opacity', 0.9);
        badgeG
            .append('text')
            .attr('x', bx)
            .attr('y', by + 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .text(String(series.value));
    }
}

/** Tick-line marker: a line across the full arc thickness, protruding 3px on each side. */
function renderTickMarker(
    g: ReturnType<typeof select<SVGGElement, unknown>>,
    d: PreparedGaugeData,
    color: string,
) {
    const {cx, cy, outerRadius, innerRadius} = d;
    const overhang = 3;
    const [x1, y1] = pointOnArc(cx, cy, innerRadius - overhang, d.valueAngleDeg);
    const [x2, y2] = pointOnArc(cx, cy, outerRadius + overhang, d.valueAngleDeg);
    g.append('line')
        .attr('class', b('marker'))
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round');
}

/** Target line: same tick-style but in white with a dark stroke, slightly thinner. */
function renderTargetLine(
    g: ReturnType<typeof select<SVGGElement, unknown>>,
    d: PreparedGaugeData,
) {
    const {cx, cy, outerRadius, innerRadius} = d;
    const overhang = 4;
    const [x1, y1] = pointOnArc(cx, cy, innerRadius - overhang, d.targetAngleDeg!);
    const [x2, y2] = pointOnArc(cx, cy, outerRadius + overhang, d.targetAngleDeg!);
    g.append('line')
        .attr('class', b('target'))
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');
    g.append('line')
        .attr('class', b('target-outline'))
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('stroke-linecap', 'round');
}

function renderDiscreteArcs(
    g: ReturnType<typeof select<SVGGElement, unknown>>,
    d: PreparedGaugeData,
) {
    const {cx, cy, outerRadius, innerRadius} = d;

    // No corner radius on individual segments — rounding only makes sense at
    // the outer endpoints of the full arc, not at internal zone boundaries.
    g.selectAll<SVGPathElement, ThresholdArc>(`.${b('zone')}`)
        .data(d.thresholdArcs)
        .join('path')
        .attr('class', b('zone'))
        .attr('transform', `translate(${cx},${cy})`)
        .attr('d', (zone) =>
            buildArcPath({
                innerRadius,
                outerRadius,
                startDeg: zone.startDeg,
                endDeg: zone.endDeg,
                cornerRadius: 0,
            }),
        )
        .attr('fill', (zone) => zone.color);
}

function renderContinuousTrack(
    g: ReturnType<typeof select<SVGGElement, unknown>>,
    d: PreparedGaugeData,
) {
    const {cx, cy, outerRadius, innerRadius, series} = d;
    const gradientId = `gauge-gradient-${series.id}`;

    const defs = g.append('defs');
    const gradient = defs
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        // Coordinates in the path's local space (path has transform="translate(cx,cy)")
        .attr('x1', -outerRadius)
        .attr('y1', 0)
        .attr('x2', outerRadius)
        .attr('y2', 0);

    d.thresholdArcs.forEach((zone, i) => {
        const pct = i / (d.thresholdArcs.length - 1 || 1);
        gradient
            .append('stop')
            .attr('offset', `${pct * 100}%`)
            .attr('stop-color', zone.color);
    });

    // Single arc with rounded caps — cornerRadius applies here
    g.append('path')
        .attr('class', b('continuous-track'))
        .attr('transform', `translate(${cx},${cy})`)
        .attr(
            'd',
            buildArcPath({
                innerRadius,
                outerRadius,
                startDeg: d.startAngleDeg,
                endDeg: d.endAngleDeg,
                cornerRadius: series.arc.cornerRadius,
            }),
        )
        .attr('fill', `url(#${gradientId})`);
}

function renderCenterText(
    g: ReturnType<typeof select<SVGGElement, unknown>>,
    d: PreparedGaugeData,
) {
    const {cx, cy, innerRadius, series, textBox} = d;
    const valueStr = String(series.value);
    const unitStr = series.unit ?? '';

    // textG transform is set after font size resolves
    const textG = g.append('g').attr('class', b('center-text'));

    const doRender = async () => {
        const maxFontSize = Math.min(innerRadius * 0.5, 64);
        const fontSize = await fitFontSize({
            text: valueStr,
            maxWidth: textBox.width * 0.9,
            maxHeight: textBox.height * 0.45,
            maxFontSize,
        });

        const unitFontSize = unitStr ? Math.max(Math.floor(fontSize * 0.4), 10) : 0;
        const unitGap = 3;

        // Shift group up by half the unit block so value+unit is centered at cy
        const unitBlockShift = unitStr ? -(unitFontSize / 2 + unitGap / 2) : 0;
        textG.attr('transform', `translate(${cx},${cy + unitBlockShift})`);

        textG
            .append('text')
            .attr('class', b('value'))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'bold')
            .text(valueStr);

        if (unitStr) {
            textG
                .append('text')
                .attr('class', b('unit'))
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'hanging')
                .attr('y', fontSize / 2 + unitGap)
                .attr('font-size', `${unitFontSize}px`)
                .text(unitStr);
        }
    };

    doRender();
}
