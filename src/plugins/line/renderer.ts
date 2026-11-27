import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import type {CurveFactory} from 'd3-shape';
import {line as lineGenerator} from 'd3-shape';
import get from 'es-toolkit/compat/get';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderDataLabels} from '~core/shapes/data-labels';
import {setActiveState} from '~core/shapes/utils';
import {getLineDashArray, getUniqId} from '~core/utils';
import {
    createGradientPaintResolver,
    getBrighterGradient,
    getGradientBBox,
} from '~core/utils/gradient';

import type {LabelData, TooltipDataChunkLine} from '../../types';
import {block} from '../../utils';

import {getLinePathPointFilter, hasSmoothInterpolation} from './path';
import type {PointData, PreparedLineData} from './types';

const b = block('line');

interface RenderLineElements {
    getCurveFactory: (interpolation?: PreparedLineData['interpolation']) => CurveFactory;
    plot: SVGGElement;
    labelsPlot: SVGGElement;
}

export function renderLine(
    elements: RenderLineElements,
    renderData: PreparedLineData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
): () => void {
    const plotSvgElement = select(elements.plot);
    const hoverOptions = get(seriesOptions, 'line.states.hover');
    const inactiveOptions = get(seriesOptions, 'line.states.inactive');
    const line = lineGenerator<PointData>()
        .x((d) => d.x as number)
        .y((d) => d.y as number);

    plotSvgElement.selectAll('*').remove();
    const resolveGradientPaint = createGradientPaintResolver(elements.plot);
    const bounds = new Map(
        renderData.map((data) => [
            data,
            data.gradientBBox === undefined
                ? getGradientBBox(data.points, hasSmoothInterpolation(data))
                : data.gradientBBox,
        ]),
    );
    const getStroke = (data: PreparedLineData, hovered = false, brightness?: number) => {
        const {gradient} = data.series;
        const state = hovered ? 'hover' : 'normal';
        const paintGradient =
            gradient && hovered ? getBrighterGradient(gradient, brightness) : gradient;

        return resolveGradientPaint({
            bbox: gradient ? (bounds.get(data) ?? null) : null,
            coords: data.gradientCoords,
            fallbackColor: data.color,
            gradient: paintGradient,
            id: `${data.id}-gradient-line-${state}`,
        });
    };
    const lineSelection = plotSvgElement
        .selectAll('path')
        .data(renderData)
        .join('path')
        .attr('d', (d) =>
            line
                .defined(getLinePathPointFilter(d))
                .curve(elements.getCurveFactory(d.interpolation))(d.points),
        )
        .attr('clip-path', ({clipYRange}) => {
            if (!clipYRange) return null;
            const [top, bottom] = clipYRange;
            let id = `line-plot-${getUniqId()}`;
            while (elements.plot.ownerDocument.getElementById(id)) {
                id = `line-plot-${getUniqId()}`;
            }
            plotSvgElement
                .append('clipPath')
                .attr('id', id)
                .append('rect')
                .attr('width', '100%')
                .attr('y', top)
                .attr('height', bottom - top);
            return `url(#${id})`;
        })
        .attr('fill', 'none')
        .attr('stroke', (d) => getStroke(d))
        .attr('stroke-width', (d) => d.lineWidth)
        .attr('stroke-linejoin', (d) => d.linejoin)
        .attr('stroke-linecap', (d) => d.linecap)
        .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.lineWidth))
        .attr('opacity', (d) => d.opacity)
        .attr('cursor', (d) => d.series.cursor);

    const dataLabels = renderData.flatMap((d) => d.svgLabels);

    const labelsSelection = renderDataLabels({
        container: select(elements.labelsPlot),
        data: dataLabels,
        className: b('label'),
    });

    const hoverEnabled = hoverOptions?.enabled;
    const inactiveEnabled = inactiveOptions?.enabled;

    function handleShapeHover(data?: TooltipDataChunkLine[]) {
        const selected = data?.filter((d) => d.series.type === 'line') || [];
        const selectedSeriesIds = selected.map((d) => d.series?.id);

        lineSelection.datum((d, index, list) => {
            const elementSelection = select<BaseType, PreparedLineData>(list[index]);

            const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
            if (d.hovered !== hovered) {
                d.hovered = hovered;
                elementSelection.attr('stroke', (dSelection) => {
                    if (dSelection.series.gradient) {
                        return getStroke(dSelection, dSelection.hovered, hoverOptions?.brightness);
                    }
                    const initialColor = dSelection.color || '';
                    if (dSelection.hovered) {
                        return (
                            color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                            initialColor
                        );
                    }
                    return initialColor;
                });
            }

            return setActiveState<PreparedLineData>({
                element: list[index],
                state: inactiveOptions,
                active: Boolean(
                    !inactiveEnabled ||
                    !selectedSeriesIds.length ||
                    selectedSeriesIds.includes(d.id),
                ),
                datum: d,
            });
        });

        labelsSelection.datum((d, index, list) => {
            return setActiveState<LabelData>({
                element: list[index],
                state: inactiveOptions,
                active: Boolean(
                    !inactiveEnabled ||
                    !selectedSeriesIds.length ||
                    selectedSeriesIds.includes(d.series.id),
                ),
                datum: d,
            });
        });
    }

    const eventName = `hover-shape.line-${renderData[0]?.id ?? 'unknown'}`;
    dispatcher?.on(eventName, handleShapeHover);

    return () => {
        dispatcher?.on(eventName, null);
    };
}
