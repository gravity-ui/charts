import React from 'react';

import {select} from 'd3';

import type {ChartScale} from '../useAxisScales';
import {useBrush} from '../useBrush';
import type {BrushArea, UseBrushProps} from '../useBrush/types';
import type {PreparedAxis, PreparedZoom} from '../useChartOptions/types';
import type {PreparedSplit} from '../useSplit/types';

import type {ZoomState} from './types';
import {selectionToZoomBounds} from './utils';

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
