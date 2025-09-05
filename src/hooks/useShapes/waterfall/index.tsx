import React from 'react';

import {color, line as lineGenerator, select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import {DASH_STYLE} from '../../../constants';
import type {LabelData} from '../../../types';
import {
    block,
    filterOverlappingLabels,
    getLineDashArray,
    getWaterfallPointColor,
} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedWaterfallData} from './types';

export {prepareWaterfallData} from './prepare-data';
export * from './types';

const b = block('waterfall');

type Args = {
    dispatcher: Dispatch<object>;
    preparedData: PreparedWaterfallData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const WaterfallSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const hoveredDataRef = React.useRef<PreparedWaterfallData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement | null>(null);
    const connectorSelector = `.${b('connector')}`;

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = get(seriesOptions, 'waterfall.states.hover');
        const inactiveOptions = get(seriesOptions, 'waterfall.states.inactive');
        svgElement.selectAll('*').remove();
        const rectSelection = svgElement
            .selectAll('allRects')
            .data(preparedData)
            .join('rect')
            .attr('class', b('segment'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height)
            .attr('width', (d) => d.width)
            .attr('fill', (d) => getWaterfallPointColor(d.data, d.series))
            .attr('opacity', (d) => d.opacity)
            .attr('cursor', (d) => d.series.cursor);

        let dataLabels = preparedData.map((d) => d.label).filter(Boolean) as LabelData[];
        if (!preparedData[0]?.series.dataLabels.allowOverlap) {
            dataLabels = filterOverlappingLabels(dataLabels);
        }

        const labelSelection = svgElement
            .selectAll('text')
            .data(dataLabels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        // Add the connector line between bars
        svgElement
            .selectAll(connectorSelector)
            .data(preparedData)
            .join('path')
            .attr('class', b('connector'))
            .attr('d', (d, index) => {
                const line = lineGenerator();

                const prev = preparedData[index - 1];
                if (!prev) {
                    return null;
                }

                const points: [number, number][] = [];
                if (Number(prev.data.y) > 0) {
                    points.push([prev.x, prev.y]);
                } else {
                    points.push([prev.x, prev.y + prev.height]);
                }

                if (Number(d.data.y) > 0 && !d.data.total) {
                    points.push([d.x + d.width, d.y + d.height]);
                } else {
                    points.push([d.x + d.width, d.y]);
                }

                return line(points);
            })
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', () => getLineDashArray(DASH_STYLE.Dash, 1));

        function handleShapeHover(data?: PreparedWaterfallData[]) {
            hoveredDataRef.current = data;
            const hoverEnabled = hoverOptions?.enabled;
            const inactiveEnabled = inactiveOptions?.enabled;

            if (!data) {
                if (hoverEnabled) {
                    rectSelection.attr('fill', (d) => getWaterfallPointColor(d.data, d.series));
                }

                if (inactiveEnabled) {
                    rectSelection.attr('opacity', null);
                    labelSelection.attr('opacity', null);
                }

                return;
            }

            if (hoverEnabled) {
                const hoveredValues = data.map((d) => d.data.x);
                rectSelection.attr('fill', (d) => {
                    const fillColor = getWaterfallPointColor(d.data, d.series);

                    if (hoveredValues.includes(d.data.x)) {
                        const brightness = hoverOptions?.brightness;
                        return color(fillColor)?.brighter(brightness).toString() || fillColor;
                    }

                    return fillColor;
                });
            }

            if (inactiveEnabled) {
                const hoveredSeries = data.map((d) => d.series.id);
                rectSelection.attr('opacity', (d) => {
                    return hoveredSeries.includes(d.series.id)
                        ? null
                        : inactiveOptions?.opacity || null;
                });
                labelSelection.attr('opacity', (d) => {
                    return hoveredSeries.includes(d.series.id)
                        ? null
                        : inactiveOptions?.opacity || null;
                });
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher.on('hover-shape.waterfall', handleShapeHover);

        return () => {
            dispatcher.on('hover-shape.waterfall', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
