import type {Selection} from 'd3-selection';
import {select} from 'd3-selection';

import {createLabelRangeProjector} from '~core/axes/label-levels';
import type {PreparedAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import {getVisibleLabelIndexes} from '~core/utils/axis/label-collision';
import {getTextSizeFn, getTextWithElipsis} from '~core/utils/text';

export interface AxisLabelLevelData {
    labels: {
        x: number;
        y: number;
        angle: number;
        text: string;
        title: string;
    }[];
    separators: string[];
    style: PreparedAxis['labels']['style'];
}

export async function prepareAdditionalAxisLabels({
    axis,
    scale,
    length,
    origin,
}: {
    axis: PreparedAxis;
    scale: ChartScale;
    length: number;
    origin: {x: number; y: number};
}): Promise<AxisLabelLevelData[]> {
    const levels = axis.labels.additionalLevels ?? [];
    if (!axis.labels.enabled || !axis.visible || !levels.length || length <= 0) {
        return [];
    }

    const horizontal = axis.position === 'bottom';
    const direction = axis.position === 'left' ? -1 : 1;
    const padding = Math.max(0, axis.labels.padding);
    const thickness = (axis.labels.additionalSize ?? 0) / levels.length;
    const offset = axis.labels.margin + (horizontal ? axis.labels.height : axis.labels.width);
    const project = createLabelRangeProjector(axis, scale, length);
    const measure = getTextSizeFn({style: axis.labels.style});
    const sizes = new Map<string, ReturnType<typeof measure>>();
    const getTextSize = (text: string) => {
        let size = sizes.get(text);
        if (!size) {
            size = measure(text);
            sizes.set(text, size);
        }
        return size;
    };
    const point = (along: number, across: number) =>
        horizontal
            ? {x: origin.x + along, y: origin.y + across}
            : {x: origin.x + direction * across, y: origin.y + along};

    return Promise.all(
        levels.map(async (level, levelIndex) => {
            const labels: AxisLabelLevelData['labels'] = [];
            const separators: string[] = [];
            const candidates = [];
            const rowStart = offset + levelIndex * thickness;

            for (const range of level.ranges) {
                const span = project(range);
                if (!span) {
                    continue;
                }
                const width = Math.max(0, span.to - span.from - padding * 2);
                const text = await getTextWithElipsis({
                    text: range.text,
                    maxWidth: width,
                    getTextWidth: async (value) => (await getTextSize(value)).width,
                });
                const size = await getTextSize(text);
                const center = (span.from + span.to) / 2;
                const position = point(center, rowStart + thickness / 2);
                if (text && size.width <= width && size.height <= thickness) {
                    candidates.push({
                        index: labels.length,
                        position: center,
                        bounds: {
                            left: center - size.width / 2,
                            right: center + size.width / 2,
                            top: 0,
                            bottom: size.height,
                        },
                    });
                    labels.push({
                        ...position,
                        angle: horizontal ? 0 : direction * 90,
                        text,
                        title: range.text,
                    });
                }
                const corners = [
                    point(span.from, rowStart + padding),
                    point(span.from, rowStart),
                    point(span.to, rowStart),
                    point(span.to, rowStart + padding),
                ];
                separators.push(corners.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(''));
            }
            const visible = getVisibleLabelIndexes(candidates, padding * 2);
            return {
                labels: labels.filter((_, index) => visible.has(index)),
                separators,
                style: axis.labels.style,
            };
        }),
    );
}

export function renderAdditionalAxisLabels(
    selection: Selection<SVGGElement, unknown, null, undefined>,
    levels: AxisLabelLevelData[],
    className: string,
) {
    const groups = selection
        .selectAll(`.${className}`)
        .data(levels)
        .join('g')
        .attr('class', className);
    groups.each(function (level) {
        const current = select(this);
        current
            .selectAll('path')
            .data(level.separators)
            .join('path')
            .attr('d', (d) => d)
            .attr('fill', 'none')
            .attr('stroke', 'var(--g-color-line-generic-active)');
        const labels = current
            .selectAll('text')
            .data(level.labels)
            .join('text')
            .attr('transform', (d) => `translate(${d.x},${d.y}) rotate(${d.angle})`)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', level.style.fontSize)
            .attr('fill', level.style.fontColor ?? 'var(--g-color-text-secondary)');
        labels.append('title').text((d) => d.title);
        labels.append('tspan').text((d) => d.text);
    });
}
