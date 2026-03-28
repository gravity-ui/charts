import React from 'react';

import {color} from 'd3-color';
import type {Dispatch} from 'd3-dispatch';
import {select} from 'd3-selection';
import get from 'lodash/get';

import {getLineDashArray} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';

import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';
import {getRectPath} from '../utils';

export {prepareXRangeData} from './prepare-data';
export type {PreparedXRangeData} from './types';

import type {PreparedXRangeData} from './types';

const b = block('x-range');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedXRangeData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function XRangeSeriesShapes(args: Args) {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const hoveredDataRef = React.useRef<PreparedXRangeData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();

        const segmentSelection = svgElement
            .selectAll(`path.${b('segment')}`)
            .data(preparedData)
            .join('path')
            .attr('d', (d) => {
                const borderRadius = Math.min(d.height / 2, d.width / 2, d.series.borderRadius);
                return getRectPath({
                    x: d.x,
                    y: d.y,
                    width: d.width,
                    height: d.height,
                    borderRadius,
                }).toString();
            })
            .attr('class', b('segment'))
            .attr('fill', (d) => d.color)
            .attr('opacity', (d) => d.data.opacity ?? d.series.opacity)
            .attr('cursor', (d) => d.series.cursor);

        svgElement
            .selectAll(`path.${b('segment-border')}`)
            .data(preparedData.filter((d) => d.series.borderWidth > 0))
            .join('path')
            .attr('d', (d) => {
                const borderRadius = Math.min(d.height / 2, d.width / 2, d.series.borderRadius);
                return getRectPath({
                    x: d.x,
                    y: d.y,
                    width: d.width,
                    height: d.height,
                    borderRadius,
                }).toString();
            })
            .attr('class', b('segment-border'))
            .attr('fill', 'none')
            .attr('stroke', (d) => d.series.borderColor)
            .attr('stroke-width', (d) => d.series.borderWidth)
            .attr('stroke-dasharray', (d) =>
                getLineDashArray(d.series.borderDashStyle, d.series.borderWidth),
            )
            .attr('opacity', (d) => d.data.opacity ?? d.series.opacity)
            .attr('pointer-events', 'none');

        svgElement
            .selectAll(`text.${b('label')}`)
            .data(
                preparedData.filter(
                    (d) =>
                        d.series.dataLabels.enabled &&
                        !d.series.dataLabels.html &&
                        d.data.label !== null,
                ),
            )
            .join('text')
            .attr('class', b('label'))
            .attr('x', (d) => d.x + d.width / 2)
            .attr('y', (d) => d.y + d.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('pointer-events', 'none')
            .style('font-size', (d) => d.series.dataLabels.style.fontSize)
            .style('font-weight', (d) => d.series.dataLabels.style.fontWeight || null)
            .style('fill', (d) => d.series.dataLabels.style.fontColor || null)
            .html((d) => getFormattedValue({value: d.data.label, ...d.series.dataLabels}));

        const hoverOptions = get(seriesOptions, 'x-range.states.hover');
        const inactiveOptions = get(seriesOptions, 'x-range.states.inactive');

        function handleShapeHover(data?: PreparedXRangeData[]) {
            hoveredDataRef.current = data;

            if (hoverOptions?.enabled) {
                const hoveredSet = new Set(data?.map((d) => d.data));
                segmentSelection.attr('fill', (d) => {
                    const fillColor = d.color;
                    if (hoveredSet.has(d.data)) {
                        return (
                            color(fillColor)?.brighter(hoverOptions.brightness).toString() ||
                            fillColor
                        );
                    }
                    return fillColor;
                });
            }

            if (inactiveOptions?.enabled) {
                const hoveredSeries = data?.map((d) => d.series.id);
                segmentSelection.attr('opacity', (d) => {
                    if (hoveredSeries?.length && !hoveredSeries.includes(d.series.id)) {
                        return inactiveOptions.opacity || null;
                    }
                    return d.data.opacity ?? d.series.opacity ?? null;
                });
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current ?? undefined);
        }

        dispatcher?.on('hover-shape.x-range', handleShapeHover);

        return () => {
            dispatcher?.on('hover-shape.x-range', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(
        () => ({htmlElements: preparedData.flatMap((d) => d.htmlElements)}),
        [preparedData],
    );

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
