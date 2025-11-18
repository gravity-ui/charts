import React from 'react';

import {pointer} from 'd3';
import {isEqual} from 'lodash';

import {isBandScale} from '../../utils';
import {useAxis} from '../useAxis';
import {useAxisScales} from '../useAxisScales';
import type {UseBrushProps} from '../useBrush/types';
import {getNormalizedSelection, isOneDimensionalSelection} from '../useBrush/utils';
import {useShapes} from '../useShapes';
import type {PreparedSplit} from '../useSplit/types';
import {selectionToZoomBounds} from '../useZoom/utils';

import type {PreparedRangeSliderProps, UseRangeSliderProps} from './types';
import {
    getDefaultRangeSliderSelection,
    getRangeSliderOffsetTop,
    getRangeSliderSelection,
} from './utils';
export const EMPTY_PREPARED_SPLIT: PreparedSplit = {
    plots: [],
    gap: 0,
};

const IS_OUTSIDE_BOUNDS = () => false;

export function useRangeSlider(props: UseRangeSliderProps): PreparedRangeSliderProps {
    const {
        boundsWidth,
        boundsOffsetLeft,
        clipPathId,
        height,
        htmlLayout,
        onUpdate,
        preparedChart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        preparedRangeSlider,
        rangeSliderState,
        width,
        xAxis,
        yAxis,
    } = props;
    const {xAxis: preparedXAxis, yAxis: preparedYAxis} = useAxis({
        boundsHeight: preparedRangeSlider.height,
        height,
        preparedChart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    });
    const {xScale, yScale} = useAxisScales({
        boundsHeight: preparedRangeSlider.height,
        boundsWidth,
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        split: EMPTY_PREPARED_SPLIT,
        xAxis: preparedXAxis,
        yAxis: preparedYAxis,
    });
    const {shapes} = useShapes({
        boundsHeight: preparedRangeSlider.height,
        boundsWidth,
        clipPathId,
        htmlLayout,
        isOutsideBounds: IS_OUTSIDE_BOUNDS,
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        shouldUseClipPathIdForScatter: true,
        split: EMPTY_PREPARED_SPLIT,
        xAxis: preparedXAxis,
        xScale,
        yAxis: preparedYAxis,
        yScale,
    });
    const selection = React.useMemo(() => {
        if (rangeSliderState) {
            return getRangeSliderSelection({rangeSliderState, xScale: xScale});
        }

        return getDefaultRangeSliderSelection({
            boundsWidth,
            defaultMax: preparedRangeSlider.defaultMax,
            defaultMin: preparedRangeSlider.defaultMin,
            xScale: xScale,
        });
    }, [
        boundsWidth,
        rangeSliderState,
        xScale,
        preparedRangeSlider.defaultMax,
        preparedRangeSlider.defaultMin,
    ]);
    const offsetTop = getRangeSliderOffsetTop({
        height,
        preparedLegend,
        preparedRangeSlider,
    });

    const onBrushEnd = React.useCallback<NonNullable<UseBrushProps['onBrushEnd']>>(
        function (_brushInstance, currentSelection) {
            if (
                yScale &&
                preparedXAxis &&
                preparedYAxis &&
                xScale &&
                currentSelection &&
                !isEqual(currentSelection, selection)
            ) {
                const {x: [min, max] = []} = selectionToZoomBounds({
                    selection: currentSelection,
                    xAxis: preparedXAxis,
                    xScale,
                    yAxes: preparedYAxis,
                    yScales: yScale,
                    zoomType: 'x',
                });

                if (typeof min === 'number' && typeof max === 'number') {
                    onUpdate({min, max});
                }
            }
        },
        [onUpdate, preparedXAxis, xScale, preparedYAxis, selection, yScale],
    );

    const onOverlayClick = React.useCallback<
        NonNullable<PreparedRangeSliderProps['onOverlayClick']>
    >(
        function (event) {
            if (
                !selection ||
                !isOneDimensionalSelection(selection) ||
                !xScale ||
                isBandScale(xScale)
            ) {
                return;
            }

            const [x] = pointer(event, this);
            const selectionLength = selection[1] - selection[0];
            const normilizedSelection = getNormalizedSelection({
                selection: [x - selectionLength / 2, x + selectionLength / 2],
                width: boundsWidth,
            }) as [number, number];
            const normilizedSelectionLength = normilizedSelection[1] - normilizedSelection[0];
            const lengthDifference = Math.abs(normilizedSelectionLength - selectionLength);

            if (lengthDifference > 0) {
                if (normilizedSelection[0] === 0) {
                    normilizedSelection[1] = normilizedSelection[1] + lengthDifference;
                } else {
                    normilizedSelection[0] = normilizedSelection[0] - lengthDifference;
                }
            }

            const min = Number(xScale.invert(normilizedSelection[0]));
            const max = Number(xScale.invert(normilizedSelection[1]));

            onUpdate({min, max});
        },
        [selection, xScale, boundsWidth, onUpdate],
    );

    return {
        ...preparedRangeSlider,
        htmlLayout,
        onBrushEnd,
        offsetLeft: boundsOffsetLeft,
        offsetTop,
        onOverlayClick,
        preparedXAxis,
        preparedYAxis,
        selection,
        shapes,
        width: boundsWidth,
        xScale,
    };
}
