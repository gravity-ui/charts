import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import type {BaseType} from 'd3-selection';
import {select} from 'd3-selection';
import {area as areaGenerator, line as lineGenerator} from 'd3-shape';
import get from 'lodash/get';

import type {LabelData, TooltipDataChunkAreaRange} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {filterOverlappingLabels} from '../../utils';
import {
    createGradientPaintResolver,
    getBrighterGradient,
    getGradientBBox,
} from '../../utils/gradient';
import {renderDataLabels} from '../data-labels';
import {setActiveState} from '../utils';

import type {AreaRangePointData, PreparedAreaRangeData} from './types';

const b = block('area-range');

function getRangeBBox(data: PreparedAreaRangeData) {
    return getGradientBBox(
        data.points.flatMap((point) => [
            {x: point.x, y: point.low},
            {x: point.x, y: point.high},
        ]),
    );
}

export function renderAreaRange(
    elements: {plot: SVGGElement},
    preparedData: PreparedAreaRangeData[],
    seriesOptions: PreparedSeriesOptions,
    allowOverlapDataLabels: boolean,
    dispatcher?: Dispatch<object>,
): () => void {
    const plotSvgElement = select(elements.plot);
    const hoverOptions = get(seriesOptions, 'area-range.states.hover');
    const inactiveOptions = get(seriesOptions, 'area-range.states.inactive');
    const resolveGradientPaint = createGradientPaintResolver(elements.plot);

    const getLineStroke = (data: PreparedAreaRangeData, hovered = false) => {
        const gradient =
            data.series.gradient && hovered
                ? getBrighterGradient(data.series.gradient, hoverOptions?.brightness)
                : data.series.gradient;
        return resolveGradientPaint({
            bbox: gradient ? getRangeBBox(data) : null,
            fallbackColor: data.color,
            gradient,
            id: `${data.id}-gradient-area-range-line-${hovered ? 'hover' : 'normal'}`,
        });
    };
    const getAreaFill = (data: PreparedAreaRangeData, hovered = false) => {
        const gradient =
            data.series.fillGradient && hovered
                ? getBrighterGradient(data.series.fillGradient, hoverOptions?.brightness)
                : data.series.fillGradient;
        return resolveGradientPaint({
            bbox: gradient ? getRangeBBox(data) : null,
            fallbackColor: data.series.fillColor,
            gradient,
            id: `${data.id}-gradient-area-range-fill-${hovered ? 'hover' : 'normal'}`,
        });
    };

    const upperLine = lineGenerator<AreaRangePointData>()
        .x((point) => point.x)
        .defined((point) => point.high !== null && point.low !== null)
        .y((point) => point.high as number);
    const lowerLine = lineGenerator<AreaRangePointData>()
        .x((point) => point.x)
        .defined((point) => point.high !== null && point.low !== null)
        .y((point) => point.low as number);
    const area = areaGenerator<AreaRangePointData>()
        .x((point) => point.x)
        .defined((point) => point.high !== null && point.low !== null)
        .y0((point) => point.low as number)
        .y1((point) => point.high as number);

    plotSvgElement.selectAll('*').remove();
    const shapeSelection = plotSvgElement
        .selectAll('shape')
        .data(preparedData)
        .join('g')
        .attr('class', b('series'))
        .attr('cursor', (data) => data.series.cursor);

    shapeSelection
        .append('path')
        .attr('class', b('region'))
        .attr('d', (data) => area(data.points))
        .attr('fill', (data) => getAreaFill(data))
        .attr('opacity', (data) => data.opacity);
    shapeSelection
        .append('path')
        .attr('class', `${b('line')} ${b('line', {bound: 'high'})}`)
        .attr('d', (data) => upperLine(data.points))
        .attr('fill', 'none')
        .attr('stroke', (data) => getLineStroke(data))
        .attr('stroke-width', (data) => data.width)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');
    shapeSelection
        .append('path')
        .attr('class', `${b('line')} ${b('line', {bound: 'low'})}`)
        .attr('d', (data) => lowerLine(data.points))
        .attr('fill', 'none')
        .attr('stroke', (data) => getLineStroke(data))
        .attr('stroke-width', (data) => data.width)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

    let dataLabels = preparedData.flatMap((data) => data.svgLabels);
    if (!allowOverlapDataLabels) {
        dataLabels = filterOverlappingLabels(dataLabels);
    }
    const labelsSelection = renderDataLabels({
        container: plotSvgElement,
        data: dataLabels,
        className: b('label'),
    });

    function handleShapeHover(data?: TooltipDataChunkAreaRange[]) {
        const selected = data?.filter((item) => item.series.type === 'area-range') ?? [];
        const selectedSeriesIds = selected.map((item) => item.series.id);

        shapeSelection.datum((item, index, list) => {
            const elementSelection = select<BaseType, PreparedAreaRangeData>(list[index]);
            const hovered = Boolean(hoverOptions?.enabled && selectedSeriesIds.includes(item.id));

            if (item.hovered !== hovered) {
                item.hovered = hovered;
                const brighten = (initialColor: string) =>
                    hovered
                        ? color(initialColor)?.brighter(hoverOptions?.brightness).toString() ||
                          initialColor
                        : initialColor;
                elementSelection
                    .selectAll(`.${b('line')}`)
                    .attr(
                        'stroke',
                        item.series.gradient ? getLineStroke(item, hovered) : brighten(item.color),
                    );
                elementSelection
                    .selectAll(`.${b('region')}`)
                    .attr(
                        'fill',
                        item.series.fillGradient
                            ? getAreaFill(item, hovered)
                            : brighten(item.series.fillColor),
                    );
            }

            return setActiveState<PreparedAreaRangeData>({
                element: list[index],
                state: inactiveOptions,
                active: Boolean(
                    !inactiveOptions?.enabled ||
                    !selectedSeriesIds.length ||
                    selectedSeriesIds.includes(item.id),
                ),
                datum: item,
            });
        });

        labelsSelection.datum((label, index, list) =>
            setActiveState<LabelData>({
                element: list[index],
                state: inactiveOptions,
                active: Boolean(
                    !inactiveOptions?.enabled ||
                    !selectedSeriesIds.length ||
                    selectedSeriesIds.includes(label.series.id),
                ),
                datum: label,
            }),
        );
    }

    dispatcher?.on('hover-shape.area-range', handleShapeHover);
    return () => dispatcher?.on('hover-shape.area-range', null);
}
