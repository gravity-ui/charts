import React from 'react';

import {select} from 'd3';

import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales';
import {useBrush} from '../useBrush';
import type {BrushArea, UseBrushProps} from '../useBrush/types';
import type {PreparedZoom} from '../useChartOptions/types';
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
    rangeSliderDomain?: [number, number];
    xAxis: PreparedXAxis | null;
    xScale?: ChartScale;
    yAxis: PreparedYAxis[];
    yScale?: (ChartScale | undefined)[];
}

export function useZoom(props: UseZoomProps) {
    const {
        node,
        onUpdate,
        plotContainerHeight,
        plotContainerWidth,
        preparedSplit,
        preparedZoom,
        rangeSliderDomain,
        xAxis,
        xScale,
        yAxis,
        yScale,
    } = props;
    const isBrushDisabled = Boolean(!xAxis || !yAxis || !xScale || !yScale);
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
                    yAxes: yAxis,
                    yScales: yScale,
                    zoomType: preparedZoom.type,
                });

                if (rangeSliderDomain && nextZoomState?.x) {
                    const [minRangeSlider, maxRangeSlider] = rangeSliderDomain;
                    const [minZoom, maxZoom] = nextZoomState.x;

                    if (minZoom < minRangeSlider) {
                        nextZoomState.x[0] = minRangeSlider;
                    }

                    if (maxZoom > maxRangeSlider) {
                        nextZoomState.x[1] = maxRangeSlider;
                    }
                }

                onUpdate(nextZoomState);
                brushInstance.clear(select(this));
            }
        },
        [onUpdate, preparedZoom?.type, rangeSliderDomain, xAxis, xScale, yAxis, yScale],
    );

    // Chart brush for manual zoom handling
    useBrush({
        areas,
        brushOptions: preparedZoom?.brush,
        disabled: isBrushDisabled,
        node,
        type: preparedZoom?.type,
        onBrushEnd: handleChartBrushEnd,
    });
}
