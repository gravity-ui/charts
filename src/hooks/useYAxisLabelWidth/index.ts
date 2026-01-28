import React from 'react';

import get from 'lodash/get';

import type {PreparedYAxis, SetAxes} from '../useAxis/types';
import {getYAxisLabelMaxWidth} from '../useAxis/y-axis';
import type {ChartScale} from '../useAxisScales/types';
import type {PreparedSeries} from '../useSeries/types';

type UseYAxisLabelWidthProps = {
    seriesData: PreparedSeries[];
    setAxes: SetAxes;
    yAxis: PreparedYAxis[];
    yScale?: (ChartScale | undefined)[];
};

export function useYAxisLabelWidth(props: UseYAxisLabelWidthProps) {
    const {seriesData, setAxes, yAxis, yScale} = props;
    const runRef = React.useRef(0);

    React.useEffect(() => {
        runRef.current++;

        (async function () {
            const currentRun = runRef.current;
            const axisIndexesToRecalculateMap: Map<number, number> = new Map();

            for (let i = 0; i < yAxis.length; i++) {
                const axis = yAxis[i];
                const scale = yScale?.[i];

                if (!scale) {
                    continue;
                }

                if (axis.startOnTick || axis.endOnTick) {
                    const axisSeriesData = seriesData.filter(
                        (s) => get(s, 'yAxis', 0) === i && s.visible,
                    );

                    if (axisSeriesData.length === 0) {
                        continue;
                    }

                    const res = await getYAxisLabelMaxWidth({
                        axis,
                        seriesData: axisSeriesData,
                        scale,
                    });

                    if (res.width > axis.labels.width) {
                        axisIndexesToRecalculateMap.set(i, res.width);
                    }
                }
            }

            if (runRef.current === currentRun && axisIndexesToRecalculateMap.size > 0) {
                setAxes((prevState) => {
                    prevState.yAxis = prevState.yAxis.map((axis, i) => {
                        const width = axisIndexesToRecalculateMap.get(i);

                        if (width) {
                            const axisWithRecalculatedLabels = {
                                ...axis,
                                labels: {...axis.labels, width},
                            };

                            return axisWithRecalculatedLabels;
                        }

                        return axis;
                    });

                    return prevState;
                });
            }
        })();
    }, [seriesData, setAxes, yAxis, yScale]);
}
