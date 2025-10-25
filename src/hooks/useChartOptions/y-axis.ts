import get from 'lodash/get';

import {getTickValues} from '../../components/AxisY/utils';
import {
    DASH_STYLE,
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    DEFAULT_AXIS_TYPE,
    axisCrosshairDefaults,
    axisLabelsDefaults,
    yAxisTitleDefaults,
} from '../../constants';
import type {BaseTextStyle, ChartSeries, ChartYAxis} from '../../types';
import {
    calculateNumericProperty,
    formatAxisTickLabel,
    getClosestPointsRange,
    getDefaultDateFormat,
    getDefaultMinYAxisValue,
    getHorizontalHtmlTextHeight,
    getHorizontalSvgTextHeight,
    getLabelsSize,
    getScaleTicks,
    getTextSizeFn,
    isAxisRelatedSeries,
    wrapText,
} from '../../utils';
import {createYScale} from '../useAxisScales';
import type {PreparedSeriesOptions} from '../useSeries/types';

import type {PreparedAxis} from './types';
import {getAxisCategories, prepareAxisPlotLabel} from './utils';

const getAxisLabelMaxWidth = async (args: {
    axis: PreparedAxis;
    seriesData: ChartSeries[];
    seriesOptions: PreparedSeriesOptions;
    height: number;
}) => {
    const {axis, seriesData, seriesOptions, height} = args;

    if (!axis.labels.enabled) {
        return {height: 0, width: 0};
    }

    const scale = createYScale({
        axis,
        boundsHeight: height,
        series: seriesData,
        seriesOptions,
    });

    if (!scale) {
        return {height: 0, width: 0};
    }

    const getTextSize = getTextSizeFn({style: axis.labels.style});
    const labelLineHeight = (await getTextSize('Tmp')).height;
    const tickValues = getTickValues({axis, scale, labelLineHeight, series: seriesData});
    const ticks = getScaleTicks(scale);
    const tickStep = getClosestPointsRange(axis, ticks);

    if (axis.type === 'datetime' && !axis.labels.dateFormat) {
        axis.labels.dateFormat = getDefaultDateFormat(tickStep);
    }

    const labels = tickValues.map((tick) =>
        formatAxisTickLabel({
            axis,
            value: tick.value,
            step: tickStep,
        }),
    );

    const size = await getLabelsSize({
        labels,
        style: axis.labels.style,
        rotation: axis.labels.rotation,
        html: axis.labels.html,
    });

    return {height: size.maxHeight, width: size.maxWidth};
};

export const getPreparedYAxis = ({
    height,
    boundsHeight,
    width,
    seriesData,
    seriesOptions,
    yAxis,
}: {
    height: number;
    boundsHeight: number;
    width: number;
    seriesData: ChartSeries[];
    seriesOptions: PreparedSeriesOptions;
    yAxis: ChartYAxis[] | undefined;
}): Promise<PreparedAxis[]> => {
    const axisByPlot: ChartYAxis[][] = [];
    const axisItems = yAxis || [{} as ChartYAxis];

    const hasAxisRelatedSeries = seriesData.some(isAxisRelatedSeries);
    if (!hasAxisRelatedSeries) {
        return Promise.resolve([]);
    }

    return Promise.all(
        axisItems.map(async (axisItem) => {
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
            const labelsHtml = get(axisItem, 'labels.html', false);
            const labelsLineHeight = labelsHtml
                ? getHorizontalHtmlTextHeight({text: 'Tmp', style: labelsStyle})
                : getHorizontalSvgTextHeight({text: 'Tmp', style: labelsStyle});
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
            const estimatedTitleRows = (
                await wrapText({
                    text: titleText,
                    style: titleStyle,
                    width: height,
                })
            ).slice(0, titleMaxRowsCount);
            const titleSize = await getLabelsSize({labels: [titleText], style: titleStyle});
            const axisType = get(axisItem, 'type', DEFAULT_AXIS_TYPE);
            const preparedAxis: PreparedAxis = {
                type: axisType,
                labels: {
                    enabled: labelsEnabled,
                    margin: labelsEnabled
                        ? get(axisItem, 'labels.margin', axisLabelsDefaults.margin)
                        : 0,
                    padding: labelsEnabled ? get(axisItem, 'labels.padding', 4) : 0,
                    dateFormat: get(axisItem, 'labels.dateFormat'),
                    numberFormat: get(axisItem, 'labels.numberFormat'),
                    style: labelsStyle,
                    rotation: labelsHtml ? 0 : get(axisItem, 'labels.rotation', 0),
                    width: 0,
                    height: 0,
                    lineHeight: labelsLineHeight,
                    maxWidth:
                        calculateNumericProperty({base: width, value: axisItem.labels?.maxWidth}) ??
                        axisLabelsDefaults.maxWidth,
                    html: labelsHtml,
                },
                lineColor: get(axisItem, 'lineColor'),
                categories: getAxisCategories(axisItem),
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
                min: get(axisItem, 'min') ?? getDefaultMinYAxisValue(seriesData),
                max: get(axisItem, 'max'),
                maxPadding: get(axisItem, 'maxPadding', 0.05),
                grid: {
                    enabled: get(
                        axisItem,
                        'grid.enabled',
                        firstPlotAxis ||
                            (!firstPlotAxis && !(axisByPlot[plotIndex][0].visible ?? true)),
                    ),
                },
                ticks: {
                    pixelInterval: axisItem.ticks?.interval
                        ? calculateNumericProperty({
                              base: height,
                              value: axisItem.ticks?.interval,
                          })
                        : axisItem.ticks?.pixelInterval,
                },
                position: get(axisItem, 'position', defaultAxisPosition),
                plotIndex: get(axisItem, 'plotIndex', 0),
                plotLines: get(axisItem, 'plotLines', []).map((d) => ({
                    value: get(d, 'value', 0),
                    color: get(d, 'color', 'var(--g-color-base-brand)'),
                    width: get(d, 'width', 1),
                    dashStyle: get(d, 'dashStyle', DASH_STYLE.Solid),
                    opacity: get(d, 'opacity', 1),
                    layerPlacement: get(d, 'layerPlacement', 'before'),
                    label: prepareAxisPlotLabel(d),
                })),
                plotBands: get(axisItem, 'plotBands', []).map((d) => ({
                    color: get(d, 'color', 'var(--g-color-base-brand)'),
                    opacity: get(d, 'opacity', 1),
                    from: get(d, 'from', 0),
                    to: get(d, 'to', 0),
                    layerPlacement: get(d, 'layerPlacement', 'before'),
                    label: prepareAxisPlotLabel(d),
                })),
                crosshair: {
                    enabled: get(axisItem, 'crosshair.enabled', axisCrosshairDefaults.enabled),
                    color: get(axisItem, 'crosshair.color', axisCrosshairDefaults.color),
                    layerPlacement: get(
                        axisItem,
                        'crosshair.layerPlacement',
                        axisCrosshairDefaults.layerPlacement,
                    ),
                    snap: get(axisItem, 'crosshair.snap', axisCrosshairDefaults.snap),
                    dashStyle: get(
                        axisItem,
                        'crosshair.dashStyle',
                        axisCrosshairDefaults.dashStyle,
                    ),
                    width: get(axisItem, 'crosshair.width', axisCrosshairDefaults.width),
                    opacity: get(axisItem, 'crosshair.opacity', axisCrosshairDefaults.opacity),
                },
                visible: get(axisItem, 'visible', true),
                order: axisItem.order,
            };

            if (labelsEnabled) {
                const {height: labelsHeight, width: labelsWidth} = await getAxisLabelMaxWidth({
                    axis: preparedAxis,
                    seriesData,
                    seriesOptions,
                    height: boundsHeight,
                });

                preparedAxis.labels.height = labelsHeight;
                preparedAxis.labels.width =
                    labelsWidth > preparedAxis.labels.maxWidth
                        ? preparedAxis.labels.maxWidth
                        : labelsWidth;
            }

            return preparedAxis;
        }),
    );
};
