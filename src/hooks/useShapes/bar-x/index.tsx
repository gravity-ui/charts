import React from 'react';

import {color, select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import type {LabelData} from '../../../types';
import {block, filterOverlappingLabels} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {getRectPath} from '../utils';

import type {PreparedBarXData} from './types';

export {prepareBarXData} from './prepare-data';
export * from './types';

const b = block('bar-x');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedBarXData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const BarXSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const hoveredDataRef = React.useRef<PreparedBarXData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = get(seriesOptions, 'bar-x.states.hover');
        const inactiveOptions = get(seriesOptions, 'bar-x.states.inactive');
        svgElement.selectAll('*').remove();
        const rectSelection = svgElement
            .selectAll('allRects')
            .data(preparedData)
            .join('path')
            .attr('d', (d) => {
                const borderRadius = d.isLastStackItem
                    ? Math.min(d.height, d.width / 2, d.series.borderRadius)
                    : 0;

                const p = getRectPath({
                    x: d.x,
                    y: d.y,
                    width: d.width,
                    height: d.height,
                    borderRadius: [borderRadius, borderRadius, 0, 0],
                });

                return p.toString();
            })
            .attr('class', b('segment'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height)
            .attr('width', (d) => d.width)
            .attr('fill', (d) => d.data.color || d.series.color)
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
            .html((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);

        function handleShapeHover(data?: PreparedBarXData[]) {
            hoveredDataRef.current = data;
            const hoverEnabled = hoverOptions?.enabled;
            const inactiveEnabled = inactiveOptions?.enabled;

            if (!data) {
                if (hoverEnabled) {
                    rectSelection.attr('fill', (d) => d.data.color || d.series.color);
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
                    const fillColor = d.data.color || d.series.color;

                    if (hoveredValues.includes(d.data.x)) {
                        return (
                            color(fillColor)?.brighter(hoverOptions?.brightness).toString() ||
                            fillColor
                        );
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

        dispatcher?.on('hover-shape.bar-x', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.bar-x', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
