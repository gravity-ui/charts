import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {
    DASH_STYLE,
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    DEFAULT_AXIS_TYPE,
    axisCrosshairDefaults,
    axisLabelsDefaults,
    yAxisTitleDefaults,
} from '../../constants';
import type {BaseTextStyle, ChartYAxis} from '../../types';
import {
    formatAxisTickLabel,
    getClosestPointsRange,
    getDefaultMinYAxisValue,
    getHorisontalSvgTextHeight,
    getLabelsSize,
    getScaleTicks,
    isAxisRelatedSeries,
    wrapText,
} from '../../utils';
import {createYScale} from '../useAxisScales';
import type {PreparedSeries} from '../useSeries/types';

import type {PreparedAxis} from './types';

const getAxisLabelMaxWidth = async (args: {axis: PreparedAxis; seriesData: PreparedSeries[]}) => {
    const {axis, seriesData} = args;

    if (!axis.labels.enabled) {
        return 0;
    }

    const scale = createYScale(axis, seriesData as PreparedSeries[], 1);
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

    const size = await getLabelsSize({
        labels,
        style: axis.labels.style,
        rotation: axis.labels.rotation,
    });

    return size.maxWidth;
};

export const getPreparedYAxis = ({
    seriesData,
    yAxis,
    height,
}: {
    seriesData: PreparedSeries[];
    yAxis: ChartYAxis[] | undefined;
    height: number;
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
                    pixelInterval: get(axisItem, 'ticks.pixelInterval'),
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
                })),
                plotBands: get(axisItem, 'plotBands', []).map((d) => ({
                    color: get(d, 'color', 'var(--g-color-base-brand)'),
                    opacity: get(d, 'opacity', 1),
                    from: get(d, 'from', 0),
                    to: get(d, 'to', 0),
                    layerPlacement: get(d, 'layerPlacement', 'before'),
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
            };

            if (labelsEnabled) {
                preparedAxis.labels.width = await getAxisLabelMaxWidth({
                    axis: preparedAxis,
                    seriesData,
                });
            }

            return preparedAxis;
        }),
    );
};
