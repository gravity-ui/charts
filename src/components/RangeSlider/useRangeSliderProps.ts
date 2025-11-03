import React from 'react';

// import {isEqual} from 'lodash';

import {
    useAxes,
    useAxisScales,
    // usePrevious,
    useShapes,
} from '../../hooks';
import type {UseBrushProps} from '../../hooks/useBrush/types';
import type {PreparedChart, PreparedRangeSlider} from '../../hooks/useChartOptions/types';
import type {PreparedLegend} from '../../hooks/useSeries/types';
import type {PreparedSplit} from '../../hooks/useSplit/types';
import {selectionToZoomBounds} from '../../hooks/useZoom/utils';

import type {PreparedRangeSliderProps, RangeSliderProps} from './types';

const EMPTY_PREPARED_SPLIT: PreparedSplit = {
    plots: [],
    gap: 0,
};

const isOutsideBounds = () => false;

function getRangeSliderOffsetTop(args: {
    height: number;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
}) {
    const {height, preparedChart, preparedLegend, preparedRangeSlider} = args;

    return (
        height -
        preparedChart.margin.bottom -
        (preparedLegend?.height ?? 0) -
        (preparedLegend?.margin ?? 0) -
        preparedRangeSlider.height
    );
}

export function useRangeSliderProps(props: RangeSliderProps): PreparedRangeSliderProps {
    const {
        boundsWidth,
        boundsOffsetLeft,
        height,
        htmlLayout,
        onUpdate,
        preparedChart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        preparedRangeSlider,
        width,
        xAxis,
        yAxis,
    } = props;
    // const prevProps = usePrevious(props);
    // console.count('----useRangeSliderProps----');
    // Object.keys(props).forEach((key) => {
    //     const currentValue = props?.[key];
    //     const prevValue = prevProps?.[key];
    //     const isPropertyEqual = isEqual(currentValue, prevValue);

    //     if (!isPropertyEqual) {
    //         console.table([
    //             {
    //                 key,
    //                 prevValue,
    //                 currentValue,
    //                 timestamp: new Date().toISOString(),
    //             },
    //         ]);
    //     }
    // });
    const {xAxis: preparedXAxis, yAxis: preparedYAxis} = useAxes({
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
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        xAxis: preparedXAxis,
        xScale,
        yAxis: preparedYAxis,
        yScale,
        split: EMPTY_PREPARED_SPLIT,
        htmlLayout,
        clipPathId: '',
        // isOutsideBounds: (x: number, y: number) => {
        //     return x < 0 || x > boundsWidth || y < 0 || y > preparedRangeSlider.height;
        // },
        isOutsideBounds,
    });
    const selection = React.useMemo(() => {
        if (props.zoomStateX && xScale) {
            // @ts-expect-error
            return [xScale(props.zoomStateX[0]), xScale(props.zoomStateX[1])] as [number, number];
        }
        return undefined;
    }, [props.zoomStateX, xScale]);
    const offsetTop = getRangeSliderOffsetTop({
        height,
        preparedChart,
        preparedLegend,
        preparedRangeSlider,
    });

    // вероятно тут не надо менять зум, тут  надо менять min max
    const onBrushEnd = React.useCallback<NonNullable<UseBrushProps['onBrushEnd']>>(
        function (_brushInstance, currentSelection) {
            if (currentSelection && yScale && preparedXAxis && preparedYAxis && xScale) {
                const nextZoomState = selectionToZoomBounds({
                    selection: currentSelection,
                    xAxis: preparedXAxis,
                    xScale,
                    yAxes: preparedYAxis,
                    yScales: yScale,
                    zoomType: 'x',
                });
                onUpdate(nextZoomState);
            }
        },
        [onUpdate, preparedXAxis, xScale, preparedYAxis, yScale],
    );

    return {
        ...preparedRangeSlider,
        onBrushEnd,
        offsetLeft: boundsOffsetLeft,
        offsetTop,
        selection,
        shapes,
        width: boundsWidth,
    };
}
