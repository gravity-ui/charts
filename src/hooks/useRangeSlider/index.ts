import React from 'react';

import {pointer} from 'd3-selection';
import {isEqual} from 'lodash';

import type {UseBrushProps} from '~core/brush/types';
import {getNormalizedSelection, isOneDimensionalSelection} from '~core/brush/utils';
import {SERIES_TYPE} from '~core/constants';
import type {PreparedSplit} from '~core/layout/split-types';
import {getRangeSliderOffsetTop, getRangeSliderSelection} from '~core/range-slider/utils';
import {isBandScale} from '~core/utils';
import {selectionToZoomBounds} from '~core/zoom/utils';

import {useAxis} from '../useAxis';
import {useAxisScales} from '../useAxisScales';
import {useShapes} from '../useShapes';
import type {ClipPathBySeriesType} from '../useShapes';

import type {PreparedRangeSliderProps, UseRangeSliderProps} from './types';

export const EMPTY_PREPARED_SPLIT: PreparedSplit = {
    plots: [],
    gap: 0,
};

const CLIP_PATH_BY_SERIES_TYPE: ClipPathBySeriesType = {
    [SERIES_TYPE.Scatter]: true,
};

export function useRangeSlider(props: UseRangeSliderProps): PreparedRangeSliderProps {
    const {
        activeLegendItems,
        boundsWidth,
        boundsOffsetLeft,
        clipPathId,
        height,
        htmlLayout,
        onUpdate,
        preparedChart,
        preparedLegend,
        legendConfig,
        preparedSeries,
        preparedSeriesOptions,
        preparedRangeSlider,
        range,
        width,
        xAxis,
        yAxis,
    } = props;
    const filteredPreparedSeries = React.useMemo(() => {
        return preparedSeries.filter((s) => {
            if (s.legend.enabled && !activeLegendItems.includes(s.legend.groupId)) {
                return false;
            }

            if ('rangeSlider' in s && !s.rangeSlider.visible) {
                return false;
            }

            return true;
        });
    }, [preparedSeries, activeLegendItems]);
    const {xAxis: preparedXAxis, yAxis: preparedYAxis} = useAxis({
        boundsHeight: preparedRangeSlider.height,
        height,
        preparedChart,
        preparedLegend,
        legendConfig,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis,
        yAxis,
    });
    const {xScale, yScale} = useAxisScales({
        boundsHeight: preparedRangeSlider.height,
        boundsWidth,
        isRangeSlider: true,
        series: preparedSeries,
        split: EMPTY_PREPARED_SPLIT,
        xAxis: preparedXAxis,
        yAxis: preparedYAxis,
    });
    const {shapes} = useShapes({
        boundsHeight: preparedRangeSlider.height,
        boundsWidth,
        clipPathId,
        clipPathBySeriesType: CLIP_PATH_BY_SERIES_TYPE,
        htmlLayout,
        isRangeSlider: true,
        series: filteredPreparedSeries,
        seriesOptions: preparedSeriesOptions,
        split: EMPTY_PREPARED_SPLIT,
        xAxis: preparedXAxis,
        xScale,
        yAxis: preparedYAxis,
        yScale,
    });
    const selection = React.useMemo(() => {
        if (range) {
            return getRangeSliderSelection({range, xScale});
        }

        return undefined;
    }, [range, xScale]);
    const offsetTop = getRangeSliderOffsetTop({
        height,
        preparedChart,
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
