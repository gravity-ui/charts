import React from 'react';

import get from 'lodash/get';

import {getTickValues} from '../../components/AxisY/utils';
import type {
    PreparedAxis,
    PreparedSeries,
    PreparedSplit,
    RangeSliderState,
    ZoomState,
} from '../../hooks';
import {getAxisHeight, getOnlyVisibleSeries, isAxisRelatedSeries} from '../../utils';

import type {ChartScale} from './types';
import {clusterYAxes} from './utils';
import {createXScale} from './x-scale';
import {createYScale} from './y-scale';

export {createXScale} from './x-scale';
export {createYScale} from './y-scale';

type Args = {
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    xAxis: PreparedAxis | null;
    yAxis: PreparedAxis[];
    split: PreparedSplit;
    isRangeSlider?: boolean;
    rangeSliderState?: RangeSliderState;
    zoomState?: Partial<ZoomState>;
};

type ReturnValue = {
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
};

const createScales = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        isRangeSlider,
        rangeSliderState,
        series,
        split,
        xAxis,
        yAxis,
        zoomState,
    } = args;
    let visibleSeries = getOnlyVisibleSeries(series);
    // Reassign to all series in case of all series unselected,
    // otherwise we will get an empty space without grid
    visibleSeries = visibleSeries.length === 0 ? series : visibleSeries;
    const axisHeight = getAxisHeight({boundsHeight, split});
    let index = 0;
    const yScale = clusterYAxes(yAxis).reduce(
        (acc, cluster) => {
            const [primaryAxis, secondaryAxis] = cluster;
            const primaryAxisSeries = series.filter((s) => {
                const seriesAxisIndex = get(s, 'yAxis', 0);
                return seriesAxisIndex === index;
            });
            const visiblePrimaryAxisSeries = getOnlyVisibleSeries(primaryAxisSeries);
            const primaryAxisScale = createYScale({
                axis: primaryAxis,
                boundsHeight: axisHeight,
                series: visiblePrimaryAxisSeries.length
                    ? visiblePrimaryAxisSeries
                    : primaryAxisSeries,
                zoomStateY: zoomState?.y?.[index],
            });
            acc.push(primaryAxisScale);
            index += 1;

            let primaryTicksCount: number | undefined;

            if (primaryAxisScale && secondaryAxis && !isRangeSlider) {
                primaryTicksCount = getTickValues({
                    axis: primaryAxis,
                    scale: primaryAxisScale,
                    labelLineHeight: primaryAxis.labels.lineHeight,
                    series: visiblePrimaryAxisSeries.length
                        ? visiblePrimaryAxisSeries
                        : primaryAxisSeries,
                }).length;
            }

            const secondAxisSeries = series.filter((s) => {
                const seriesAxisIndex = get(s, 'yAxis', 0);
                return seriesAxisIndex === index;
            });
            const visibleSecondAxisSeries = getOnlyVisibleSeries(secondAxisSeries);
            const secondaryAxisScale = secondaryAxis
                ? createYScale({
                      axis: secondaryAxis,
                      boundsHeight: axisHeight,
                      primaryAxis,
                      primaryTicksCount,
                      series: visibleSecondAxisSeries.length
                          ? visibleSecondAxisSeries
                          : secondAxisSeries,
                      zoomStateY: zoomState?.y?.[index],
                  })
                : undefined;
            if (secondaryAxisScale) {
                acc.push(secondaryAxisScale);
                index += 1;
            }
            return acc;
        },
        [] as (ChartScale | undefined)[],
    );

    return {
        xScale: xAxis
            ? createXScale({
                  axis: xAxis,
                  boundsWidth,
                  rangeSliderState,
                  series: visibleSeries,
                  zoomStateX: zoomState?.x,
              })
            : undefined,
        yScale,
    };
};

/**
 * Uses to create scales for axis related series
 */
export const useAxisScales = (args: Args): ReturnValue => {
    const {
        boundsWidth,
        boundsHeight,
        isRangeSlider,
        rangeSliderState,
        series,
        split,
        xAxis,
        yAxis,
        zoomState,
    } = args;
    return React.useMemo(() => {
        let xScale: ChartScale | undefined;
        let yScale: (ChartScale | undefined)[] | undefined;
        const hasAxisRelatedSeries = series.some(isAxisRelatedSeries);

        if (hasAxisRelatedSeries) {
            ({xScale, yScale} = createScales({
                boundsWidth,
                boundsHeight,
                isRangeSlider,
                rangeSliderState,
                series,
                split,
                xAxis,
                yAxis,
                zoomState,
            }));
        }

        return {xScale, yScale};
    }, [
        boundsWidth,
        boundsHeight,
        isRangeSlider,
        rangeSliderState,
        series,
        split,
        xAxis,
        yAxis,
        zoomState,
    ]);
};
