import get from 'lodash/get';

import {applyAxisPadding} from '~core/scales/axis-padding';
import type {ChartScale} from '~core/scales/types';
import {clusterYAxes} from '~core/scales/utils';
import {createXScale} from '~core/scales/x-scale';
import {createYScale} from '~core/scales/y-scale';
import type {PreparedSeriesOptions} from '~core/series/types';
import {getAxisHeight, getOnlyVisibleSeries} from '~core/utils';

import {getAutomaticTickValues} from '../../components/AxisY/utils';
import type {
    PreparedSeries,
    PreparedSplit,
    PreparedXAxis,
    PreparedYAxis,
    RangeSliderState,
    ZoomState,
} from '../../hooks';

export {createXScale} from '~core/scales/x-scale';
export {createYScale} from '~core/scales/y-scale';

interface Args {
    seriesOptions?: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    split: PreparedSplit;
    isRangeSlider?: boolean;
    rangeSliderState?: RangeSliderState;
    zoomState?: Partial<ZoomState>;
}

export const createScales = (args: Args) => {
    const {
        seriesOptions,
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
    // For range slider: always use all series regardless of visibility so the slider domain
    // stays stable when the user hides/shows series via the legend.
    let visibleSeries = isRangeSlider ? series : getOnlyVisibleSeries(series);
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
                primaryTicksCount = getAutomaticTickValues({
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

    const scales = {
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
    if (!isRangeSlider && xAxis && scales.xScale) {
        applyAxisPadding({
            ...scales,
            xScale: scales.xScale,
            xAxis,
            yAxis,
            split,
            series,
            seriesOptions,
            // The slider's initial selection is derived from this scale before its state exists.
            fixedX: Boolean(xAxis.rangeSlider?.enabled || zoomState?.x || rangeSliderState),
            fixedY: yAxis.map((_, i) => Boolean(zoomState?.y?.[i])),
        });
    }
    return scales;
};
