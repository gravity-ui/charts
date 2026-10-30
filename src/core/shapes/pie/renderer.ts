import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import type {BaseType} from 'd3-selection';
import type {PieArcDatum} from 'd3-shape';
import get from 'lodash/get';

import type {TooltipDataChunkPie} from '../../../types';
import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../series/types';
import {renderDataLabels} from '../../shapes/data-labels';
import {setActiveState} from '../../shapes/utils';
import {setEllipsisForOverflowTexts} from '../../utils';

import type {PieConnectorData, PieSvgLabelData, PreparedPieData, SegmentData} from './types';
import {getPieArcPath} from './utils';

const b = block('pie');
export function getHaloVisibility(d: PieArcDatum<SegmentData>) {
    const enabled = d.data.pie.halo.enabled && d.data.hovered;
    return enabled ? '' : 'hidden';
}

export function renderPie(
    elements: {
        plot: SVGGElement;
        labelsPlot: SVGGElement;
    },
    preparedData: PreparedPieData[],
    seriesOptions: PreparedSeriesOptions,
    dispatcher?: Dispatch<object>,
    registerCompletion?: (completion: Promise<void>) => void,
    signal?: AbortSignal,
): () => void {
    const svgElement = select(elements.plot);
    svgElement.selectAll('*').remove();
    const labelsSvgElement = select(elements.labelsPlot);
    labelsSvgElement.selectAll('*').remove();
    const segmentSelector = `.${b('segment')}`;
    const connectorSelector = `.${b('connector')}`;

    const shapesSelection = svgElement
        .selectAll<SVGGElement, PreparedPieData>('pie')
        .data(preparedData)
        .join('g')
        .attr('id', (pieData) => pieData.id)
        .attr('class', b('item'))
        .attr('transform', (pieData) => {
            const [x, y] = pieData.center;
            return `translate(${x}, ${y})`;
        })
        .style('stroke-width', (pieData) => pieData.borderWidth)
        .attr('cursor', (pieData) => pieData.series.cursor);

    // Render halo appearing outside the hovered slice
    shapesSelection
        .selectAll('halo')
        .data((pieData) => {
            if (pieData.halo.enabled) {
                return pieData.segments;
            }
            return [];
        })
        .join('path')
        .attr('d', (d) => getPieArcPath(d, d.data.radius + d.data.pie.halo.size))
        .attr('class', b('halo'))
        .attr('fill', (d) => d.data.color)
        .attr('opacity', (d) => d.data.pie.halo.opacity)
        .attr('z-index', -1)
        .attr('visibility', getHaloVisibility);

    // Render segments
    shapesSelection
        .selectAll(segmentSelector)
        .data((pieData) => pieData.segments)
        .join('path')
        .attr('d', (d) => getPieArcPath(d, d.data.radius))
        .attr('class', b('segment'))
        .style('stroke', (d) => d.data.series.borderColor)
        .attr('fill', (d) => d.data.color)
        .attr('opacity', (d) => d.data.opacity);

    const labelGroups = labelsSvgElement
        .selectAll<SVGGElement, PreparedPieData>('g')
        .data(preparedData)
        .join('g')
        .attr('transform', (pieData) => {
            const [x, y] = pieData.center;
            return `translate(${x}, ${y})`;
        })
        .style('stroke-width', (pieData) => pieData.borderWidth)
        .attr('cursor', (pieData) => pieData.series.cursor);

    // render Labels
    renderDataLabels({
        container: labelGroups,
        data: (pieData) => pieData.labels,
        className: b('label'),
    }).call(setEllipsisForOverflowTexts, (d) =>
        d.size.width > d.maxWidth ? d.maxWidth : Infinity,
    );

    // Add the polyline between chart and labels
    labelGroups
        .selectAll(connectorSelector)
        .data((pieData) => pieData.connectors)
        .enter()
        .append('path')
        .attr('class', b('connector'))
        .attr('d', (d) => d.path)
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', 1)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .style('fill', 'none');

    let cancelled = false;
    // Optional nodes delay export completion, while main paths remain immediately visible.
    const pending: Promise<void>[] = [];
    shapesSelection.each(function (d) {
        const node = this;
        const completion = Promise.resolve()
            .then(() => d.series.renderCustomShape?.({series: {innerRadius: d.innerRadius}}))
            .then((customShape) => {
                if (!cancelled && !signal?.aborted && customShape) node.append(customShape as Node);
            })
            .catch(() => undefined);
        pending.push(completion);
    });
    registerCompletion?.(Promise.all(pending).then(() => undefined));

    const eventName = `hover-shape.pie`;
    const hoverOptions = get(seriesOptions, 'pie.states.hover');
    const inactiveOptions = get(seriesOptions, 'pie.states.inactive');
    const labelNodes = labelGroups.nodes();

    dispatcher?.on(eventName, (data?: TooltipDataChunkPie[]) => {
        const selectedSeriesId = data?.[0]?.series?.id;
        const hoverEnabled = hoverOptions?.enabled;
        const inactiveEnabled = inactiveOptions?.enabled;

        shapesSelection.datum((_d, index, list) => {
            const pieSelection = select<BaseType, PreparedPieData>(list[index]);
            const haloSelection = pieSelection.selectAll<BaseType, PieArcDatum<SegmentData>>(
                `.${b('halo')}`,
            );

            pieSelection
                .selectAll<BaseType, PieArcDatum<SegmentData>>(segmentSelector)
                .datum((d, i, elements) => {
                    const hovered = Boolean(hoverEnabled && d.data.series.id === selectedSeriesId);
                    if (d.data.hovered !== hovered) {
                        d.data.hovered = hovered;
                        select(elements[i]).attr('fill', () => {
                            const initialColor = d.data.color;
                            if (d.data.hovered) {
                                return (
                                    color(initialColor)
                                        ?.brighter(hoverOptions?.brightness)
                                        .toString() || initialColor
                                );
                            }
                            return initialColor;
                        });

                        const currentSegmentHalo = haloSelection.nodes()[i];
                        select<BaseType, PieArcDatum<SegmentData>>(currentSegmentHalo).attr(
                            'visibility',
                            getHaloVisibility,
                        );
                    }

                    setActiveState<SegmentData>({
                        element: elements[i],
                        state: inactiveOptions,
                        active: Boolean(
                            !inactiveEnabled ||
                            !selectedSeriesId ||
                            selectedSeriesId === d.data.series.id,
                        ),
                        datum: d.data,
                    });

                    return d;
                });
            const pieLabels = select(labelNodes[index]);
            const labelSelection = pieLabels.selectAll<
                BaseType,
                PieSvgLabelData | PieConnectorData
            >(`.${b('label')}, ${connectorSelector}`);
            labelSelection.datum((d, i, elements) => {
                return setActiveState<PieSvgLabelData | PieConnectorData>({
                    element: elements[i],
                    state: inactiveOptions,
                    active: Boolean(
                        !inactiveEnabled || !selectedSeriesId || selectedSeriesId === d.series.id,
                    ),
                    datum: d,
                });
            });
        });
    });

    return () => {
        cancelled = true;
        dispatcher?.on(eventName, null);
    };
}
