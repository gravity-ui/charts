import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    DEFAULT_AXIS_TYPE,
    DashStyle,
    axisLabelsDefaults,
    yAxisTitleDefaults,
} from '../../constants';
import type {BaseTextStyle, ChartSeries, ChartYAxis} from '../../types';
import {
    CHART_SERIES_WITH_VOLUME_ON_Y_AXIS,
    formatAxisTickLabel,
    getClosestPointsRange,
    getHorisontalSvgTextHeight,
    getLabelsSize,
    getScaleTicks,
    getWaterfallPointSubtotal,
    wrapText,
} from '../../utils';
import {createYScale} from '../useAxisScales';
import type {PreparedSeries, PreparedWaterfallSeries} from '../useSeries/types';

import type {PreparedAxis} from './types';

const getAxisLabelMaxWidth = (args: {axis: PreparedAxis; series: ChartSeries[]}) => {
    const {axis, series} = args;

    if (!axis.labels.enabled) {
        return 0;
    }

    const scale = createYScale(axis, series as PreparedSeries[], 1);
    const ticks: AxisDomain[] = getScaleTicks(scale as AxisScale<AxisDomain>);

    // FIXME: it is necessary to filter data, since we do not draw overlapping ticks

    const step = getClosestPointsRange(axis, ticks);
    const labels = (ticks as (string | number)[]).map((tick) =>
        formatAxisTickLabel({
            axis,
            value: tick,
            step,
        }),
    );

    return getLabelsSize({
        labels,
        style: axis.labels.style,
        rotation: axis.labels.rotation,
    }).maxWidth;
};

function getAxisMin(axis?: ChartYAxis, series?: ChartSeries[]) {
    const min = axis?.min;

    if (
        typeof min === 'undefined' &&
        series?.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type))
    ) {
        return series.reduce((minValue, s) => {
            switch (s.type) {
                case 'waterfall': {
                    const minSubTotal = s.data.reduce(
                        (res, d) =>
                            Math.min(
                                res,
                                getWaterfallPointSubtotal(d, s as PreparedWaterfallSeries) || 0,
                            ),
                        0,
                    );
                    return Math.min(minValue, minSubTotal);
                }
                default: {
                    // @ts-expect-error
                    const minYValue = s.data.reduce((res, d) => Math.min(res, get(d, 'y', 0)), 0);
                    return Math.min(minValue, minYValue);
                }
            }
        }, 0);
    }

    return min;
}

export const getPreparedYAxis = ({
    series,
    yAxis,
    height,
}: {
    series: ChartSeries[];
    yAxis: ChartYAxis[] | undefined;
    height: number;
}): PreparedAxis[] => {
    const axisByPlot: ChartYAxis[][] = [];
    const axisItems = yAxis || [{} as ChartYAxis];
    return axisItems.map((axisItem) => {
        const plotIndex = get(axisItem, 'plotIndex', 0);
        const firstPlotAxis = !axisByPlot[plotIndex];
        if (firstPlotAxis) {
            axisByPlot[plotIndex] = [];
        }
        axisByPlot[plotIndex].push(axisItem);
        const defaultAxisPosition = firstPlotAxis ? 'left' : 'right';

        const labelsEnabled = get(axisItem, 'labels.enabled', true);

        const labelsStyle: BaseTextStyle = {
            fontSize: get(axisItem, 'labels.style.fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE),
        };
        const titleText = get(axisItem, 'title.text', '');
        const titleStyle = {
            ...yAxisTitleDefaults.style,
            ...get(axisItem, 'title.style'),
        };
        const titleMaxRowsCount = get(
            axisItem,
            'title.maxRowCount',
            yAxisTitleDefaults.maxRowCount,
        );
        const estimatedTitleRows = wrapText({
            text: titleText,
            style: titleStyle,
            width: height,
        }).slice(0, titleMaxRowsCount);
        const titleSize = getLabelsSize({labels: [titleText], style: titleStyle});
        const axisType = get(axisItem, 'type', DEFAULT_AXIS_TYPE);
        const preparedAxis: PreparedAxis = {
            type: axisType,
            labels: {
                enabled: labelsEnabled,
                margin: labelsEnabled
                    ? get(axisItem, 'labels.margin', axisLabelsDefaults.margin)
                    : 0,
                padding: labelsEnabled
                    ? get(axisItem, 'labels.padding', axisLabelsDefaults.padding)
                    : 0,
                dateFormat: get(axisItem, 'labels.dateFormat'),
                numberFormat: get(axisItem, 'labels.numberFormat'),
                style: labelsStyle,
                rotation: get(axisItem, 'labels.rotation', 0),
                width: 0,
                height: 0,
                lineHeight: getHorisontalSvgTextHeight({text: 'TmpLabel', style: labelsStyle}),
                maxWidth: get(axisItem, 'labels.maxWidth', axisLabelsDefaults.maxWidth),
            },
            lineColor: get(axisItem, 'lineColor'),
            categories: get(axisItem, 'categories'),
            timestamps: get(axisItem, 'timestamps'),
            title: {
                text: titleText,
                margin: get(axisItem, 'title.margin', yAxisTitleDefaults.margin),
                style: titleStyle,
                width: titleSize.maxWidth,
                height: titleSize.maxHeight * estimatedTitleRows.length,
                align: get(axisItem, 'title.align', yAxisTitleDefaults.align),
                maxRowCount: titleMaxRowsCount,
            },
            min: getAxisMin(axisItem, series),
            maxPadding: get(axisItem, 'maxPadding', 0.05),
            grid: {
                enabled: get(axisItem, 'grid.enabled', firstPlotAxis),
            },
            ticks: {
                pixelInterval: get(axisItem, 'ticks.pixelInterval'),
            },
            position: get(axisItem, 'position', defaultAxisPosition),
            plotIndex: get(axisItem, 'plotIndex', 0),
            plotLines: get(axisItem, 'plotLines', []).map((d) => ({
                value: get(d, 'value', 0),
                color: get(d, 'color', 'var(--g-color-base-brand)'),
                width: get(d, 'width', 1),
                dashStyle: get(d, 'dashStyle', DashStyle.Solid) as DashStyle,
                opacity: get(d, 'opacity', 1),
                layerPlacement: get(d, 'layerPlacement', 'before'),
            })),
        };

        if (labelsEnabled) {
            preparedAxis.labels.width = getAxisLabelMaxWidth({axis: preparedAxis, series});
        }

        return preparedAxis;
    });
};
