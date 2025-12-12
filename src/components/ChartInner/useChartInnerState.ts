import React from 'react';

import type {Dispatch} from 'd3';
import isEqual from 'lodash/isEqual';

import {ZOOM_TYPE} from '../../constants';
import type {ZoomType} from '../../constants';
import type {
    PreparedChart,
    PreparedRangeSlider,
    PreparedTooltip,
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import {EventType, isMacintosh} from '../../utils';

type Props = {
    dispatcher: Dispatch<object>;
    preparedChart: PreparedChart;
    preparedRangeSlider: PreparedRangeSlider;
    tooltip?: PreparedTooltip;
};

const RANGE_SLIDER_SYNC_ZOOM_TYPES: ZoomType[] = [ZOOM_TYPE.X, ZOOM_TYPE.XY];

export function useChartInnerState(props: Props) {
    const {dispatcher, preparedChart, preparedRangeSlider, tooltip} = props;
    const [tooltipPinned, setTooltipPinned] = React.useState(false);
    const [zoomState, setZoomState] = React.useState<Partial<ZoomState>>({});
    const [rangeSliderState, setRangeSliderState] = React.useState<RangeSliderState | undefined>();
    const [initialized, setInitialized] = React.useState(!preparedRangeSlider.enabled);
    const tooltipEnabled = tooltip?.enabled;
    const tooltipPinEnabled = tooltip?.pin?.enabled;
    const modifierKey = tooltip?.pin?.modifierKey;
    const rangeSliderEnabled = preparedRangeSlider.enabled;

    const togglePinTooltip = React.useCallback(
        (value: boolean, event: React.MouseEvent) => {
            let resultValue = value;

            if (value && modifierKey) {
                switch (modifierKey) {
                    case 'altKey': {
                        resultValue = event.altKey;
                        break;
                    }
                    case 'metaKey': {
                        resultValue = isMacintosh() ? event.metaKey : event.ctrlKey;
                    }
                }
            }

            setTooltipPinned(resultValue);
        },
        [modifierKey],
    );

    const unpinTooltip = React.useCallback(() => {
        setTooltipPinned(false);
        dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
    }, [dispatcher]);

    const updateZoomState = React.useCallback(
        (nextZoomState: Partial<ZoomState>) => {
            if (!isEqual(zoomState, nextZoomState)) {
                setZoomState(nextZoomState);

                if (rangeSliderEnabled && nextZoomState?.x) {
                    const [xMin, xMax] = nextZoomState.x;
                    setRangeSliderState({
                        max: xMax,
                        min: xMin,
                    });
                }
            }
        },
        [rangeSliderEnabled, zoomState],
    );

    const updateRangeSliderState = React.useCallback(
        (nextRangeSliderState?: RangeSliderState, syncZoom = true) => {
            if (!isEqual(rangeSliderState, nextRangeSliderState)) {
                setRangeSliderState(
                    nextRangeSliderState
                        ? {
                              max: nextRangeSliderState.max,
                              min: nextRangeSliderState.min,
                          }
                        : undefined,
                );

                if (
                    syncZoom &&
                    nextRangeSliderState &&
                    preparedChart.zoom &&
                    Object.keys(zoomState || {}).length > 0 &&
                    RANGE_SLIDER_SYNC_ZOOM_TYPES.includes(preparedChart.zoom.type)
                ) {
                    setZoomState({
                        x: [nextRangeSliderState.min, nextRangeSliderState.max],
                    });
                }
            }
        },
        [preparedChart.zoom, rangeSliderState, zoomState],
    );

    return {
        initialized,
        rangeSliderState,
        setInitialized,
        tooltipPinned,
        togglePinTooltip: tooltipEnabled && tooltipPinEnabled ? togglePinTooltip : undefined,
        unpinTooltip: tooltipEnabled && tooltipPinEnabled ? unpinTooltip : undefined,
        updateRangeSliderState,
        updateZoomState,
        zoomState,
    };
}
