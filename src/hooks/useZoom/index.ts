import React from 'react';

import {select} from 'd3';
import type {BrushSelection, ScaleBand, ScaleLinear, ScaleTime} from 'd3';

import type {ChartScale} from '../useAxisScales';
import {useBrush} from '../useBrush';
import type {BrushArea, UseBrushProps} from '../useBrush/types';
import type {PreparedAxis, PreparedZoom} from '../useChartOptions/types';
import type {PreparedSplit} from '../useSplit/types';

import type {ZoomState} from './types';

interface UseZoomProps {
    node: SVGGElement | null;
    onUpdate: (zoomState: Partial<ZoomState>) => void;
    plotContainerHeight: number;
    plotContainerWidth: number;
    preparedSplit: PreparedSplit;
    preparedZoom: PreparedZoom | null;
    xAxis: PreparedAxis;
    xScale?: ChartScale;
    yAxis: PreparedAxis[];
    yScale?: ChartScale[];
}

function selectionToZoomBounds(args: {
    selection: BrushSelection;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxises: PreparedAxis[];
    yScales: ChartScale[];
    zoomType: PreparedZoom['type'];
}): Partial<ZoomState> {
    const {selection, xAxis, xScale, yAxises, yScales, zoomType} = args;
    const zoomState: Partial<ZoomState> = {};

    switch (zoomType) {
        case 'x': {
            const [x0, x1] = selection as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            break;
        }
        case 'y': {
            const [y1, y0] = selection as [number, number];
            yAxises.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }
                zoomState.y.push(
                    selectionYToZoomBounds({
                        yAxis,
                        yScale: yScales[index],
                        selection: [y1, y0],
                    }),
                );
            });
            break;
        }
        case 'xy': {
            const [x0, y0] = selection[0] as [number, number];
            const [x1, y1] = selection[1] as [number, number];
            zoomState.x = selectionXToZoomBounds({xAxis, xScale, selection: [x0, x1]});
            yAxises.forEach((yAxis, index) => {
                if (!Array.isArray(zoomState.y)) {
                    zoomState.y = [];
                }
                zoomState.y.push(
                    selectionYToZoomBounds({
                        yAxis,
                        yScale: yScales[index],
                        selection: [y0, y1],
                    }),
                );
            });
            break;
        }
    }

    return zoomState;
}

function selectionXToZoomBounds(args: {
    xAxis: PreparedAxis;
    xScale: ChartScale;
    selection: BrushSelection;
}): [number, number] {
    const {xAxis, xScale, selection} = args;

    switch (xAxis.type) {
        case 'category': {
            const [x0, x1] = selection as [number, number];
            const bandScale = xScale as ScaleBand<string>;
            const categories = xAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            let startIndex = Math.floor(x0 / step);
            let endIndex = Math.floor(x1 / step);
            const startCategory = currentDomain[startIndex];
            const endCategory = currentDomain[endIndex];
            startIndex = categories.indexOf(startCategory);
            endIndex = categories.indexOf(endCategory);

            if (!categories[startIndex]) {
                startIndex = 0;
            }

            if (!categories[endIndex]) {
                endIndex = categories.length - 1;
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [x0, x1] = selection as [number, number];
            const timeScale = xScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(x0).getTime();
            const maxTimestamp = timeScale.invert(x1).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [x0, x1] = selection as [number, number];
            const linearScale = xScale as ScaleLinear<number, number>;
            const minValue = linearScale.invert(x0);
            const maxValue = linearScale.invert(x1);

            return [minValue, maxValue];
        }
        default: {
            throw new Error(`Invalid axis type: ${xAxis.type}`);
        }
    }
}

function selectionYToZoomBounds(args: {
    yAxis: PreparedAxis;
    yScale: ChartScale;
    selection: BrushSelection;
}): [number, number] {
    const {yAxis, yScale, selection} = args;

    switch (yAxis.type) {
        case 'category': {
            const [y1, y0] = selection as [number, number];
            const bandScale = yScale as ScaleBand<string>;
            const categories = yAxis.categories || [];
            const currentDomain = bandScale.domain();
            const step = bandScale.step();
            let startIndex = currentDomain.length - 1 - Math.floor(y0 / step);
            let endIndex = currentDomain.length - 1 - Math.floor(y1 / step);
            const startCategory = currentDomain[startIndex];
            const endCategory = currentDomain[endIndex];
            startIndex = categories.indexOf(startCategory);
            endIndex = categories.indexOf(endCategory);

            if (!categories[startIndex]) {
                startIndex = 0;
            }

            if (!categories[endIndex]) {
                endIndex = categories.length - 1;
            }

            return [startIndex, endIndex];
        }
        case 'datetime': {
            const [y1, y0] = selection as [number, number];
            const timeScale = yScale as ScaleTime<number, number>;
            const minTimestamp = timeScale.invert(y0).getTime();
            const maxTimestamp = timeScale.invert(y1).getTime();

            return [minTimestamp, maxTimestamp];
        }
        case 'linear':
        case 'logarithmic': {
            const [y1, y0] = selection as [number, number];
            const linearScale = yScale as ScaleLinear<number, number>;
            const minValue = linearScale.invert(y0);
            const maxValue = linearScale.invert(y1);

            return [minValue, maxValue];
        }
        default: {
            throw new Error(`Invalid axis type: ${yAxis.type}`);
        }
    }
}

export function useZoom(props: UseZoomProps) {
    const {
        node,
        onUpdate,
        plotContainerHeight,
        plotContainerWidth,
        preparedSplit,
        preparedZoom,
        xAxis,
        xScale,
        yAxis,
        yScale,
    } = props;

    const areas: BrushArea[] = React.useMemo(() => {
        const result: BrushArea[] = [];

        if (!preparedZoom) {
            return result;
        }

        if (preparedSplit.plots.length > 1) {
            preparedSplit.plots.forEach((plot) => {
                result.push({
                    extent: [
                        [0, plot.top],
                        [plotContainerWidth, plot.top + plot.height],
                    ],
                });
            });
        } else {
            result.push({
                extent: [
                    [0, 0],
                    [plotContainerWidth, plotContainerHeight],
                ],
            });
        }

        return result;
    }, [plotContainerHeight, plotContainerWidth, preparedSplit.plots, preparedZoom]);

    const handleChartBrushEnd = React.useCallback<NonNullable<UseBrushProps['onBrushEnd']>>(
        function (brushInstance, selection) {
            if (selection && yScale && xAxis && yAxis && xScale && preparedZoom?.type) {
                const nextZoomState = selectionToZoomBounds({
                    selection,
                    xAxis,
                    xScale,
                    yAxises: yAxis,
                    yScales: yScale,
                    zoomType: preparedZoom.type,
                });
                onUpdate(nextZoomState);
                brushInstance.clear(select(this));
            }
        },
        [onUpdate, preparedZoom?.type, xAxis, xScale, yAxis, yScale],
    );

    // Chart brush for manual zoom handling
    useBrush({
        areas,
        brushOptions: preparedZoom?.brush,
        node,
        type: preparedZoom?.type,
        onBrushEnd: handleChartBrushEnd,
    });
}
