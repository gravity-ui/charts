import type {AxisDomain} from 'd3';
import get from 'lodash/get';

import {
    DASH_STYLE,
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    SeriesType,
    axisCrosshairDefaults,
    axisLabelsDefaults,
    xAxisTitleDefaults,
} from '../../constants';
import type {BaseTextStyle, ChartSeries, ChartXAxis} from '../../types';
import {
    calculateCos,
    calculateNumericProperty,
    formatAxisTickLabel,
    getAxisItems,
    getClosestPointsRange,
    getDefaultDateFormat,
    getHorizontalHtmlTextHeight,
    getHorizontalSvgTextHeight,
    getLabelsSize,
    getMaxTickCount,
    getTicksCount,
    hasOverlappingLabels,
    wrapText,
} from '../../utils';
import {createXScale} from '../useAxisScales';
import type {PreparedSeriesOptions} from '../useSeries/types';

import type {PreparedAxis} from './types';
import {getAxisCategories, prepareAxisPlotLabel} from './utils';

async function setLabelSettings({
    axis,
    seriesData,
    seriesOptions,
    width,
    autoRotation = true,
}: {
    axis: PreparedAxis;
    seriesData: ChartSeries[];
    seriesOptions: PreparedSeriesOptions;
    width: number;
    autoRotation?: boolean;
}) {
    const scale = createXScale({axis, series: seriesData, seriesOptions, boundsWidth: width});

    if (!scale) {
        axis.labels.height = 0;
        axis.labels.rotation = 0;
        return;
    }

    const tickCount = getTicksCount({axis, range: width});
    const ticks = getAxisItems({
        scale: scale,
        count: tickCount,
        maxCount: getMaxTickCount({width, axis}),
    });
    const step = getClosestPointsRange(axis, ticks);
    if (axis.type === 'datetime' && !axis.labels.dateFormat) {
        axis.labels.dateFormat = getDefaultDateFormat(step);
    }

    const labels = ticks.map((value: AxisDomain) => {
        return formatAxisTickLabel({
            axis,
            value,
            step,
        });
    });
    const overlapping = axis.labels.html
        ? false
        : hasOverlappingLabels({
              width,
              labels,
              padding: axis.labels.padding,
              style: axis.labels.style,
          });

    const defaultRotation = overlapping && autoRotation ? -45 : 0;
    const rotation = axis.labels.html ? 0 : axis.labels.rotation || defaultRotation;
    const labelsHeight =
        rotation || axis.labels.html
            ? (
                  await getLabelsSize({
                      labels,
                      style: axis.labels.style,
                      rotation,
                      html: axis.labels.html,
                  })
              ).maxHeight
            : axis.labels.lineHeight;
    const maxHeight = rotation ? calculateCos(rotation) * axis.labels.maxWidth : labelsHeight;

    axis.labels.height = Math.min(maxHeight, labelsHeight);
    axis.labels.rotation = rotation;
}

export const getPreparedXAxis = async ({
    xAxis,
    seriesData,
    seriesOptions,
    width,
}: {
    xAxis?: ChartXAxis;
    seriesData: ChartSeries[];
    seriesOptions: PreparedSeriesOptions;
    width: number;
}): Promise<PreparedAxis> => {
    const titleText = get(xAxis, 'title.text', '');
    const titleStyle: BaseTextStyle = {
        ...xAxisTitleDefaults.style,
        ...get(xAxis, 'title.style'),
    };
    const titleMaxRowsCount = get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount);
    const estimatedTitleRows = (
        await wrapText({
            text: titleText,
            style: titleStyle,
            width,
        })
    ).slice(0, titleMaxRowsCount);
    const titleSize = await getLabelsSize({
        labels: [titleText],
        style: titleStyle,
    });
    const labelsStyle = {
        fontSize: get(xAxis, 'labels.style.fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE),
    };
    const labelsHtml = get(xAxis, 'labels.html', false);
    const labelsLineHeight = labelsHtml
        ? getHorizontalHtmlTextHeight({text: 'Tmp', style: labelsStyle})
        : getHorizontalSvgTextHeight({text: 'Tmp', style: labelsStyle});

    const shouldHideGrid = seriesData.some((s) => s.type === SeriesType.Heatmap);

    const preparedXAxis: PreparedAxis = {
        type: get(xAxis, 'type', 'linear'),
        labels: {
            enabled: get(xAxis, 'labels.enabled', true),
            margin: get(xAxis, 'labels.margin', axisLabelsDefaults.margin),
            padding: get(xAxis, 'labels.padding', axisLabelsDefaults.padding),
            dateFormat: get(xAxis, 'labels.dateFormat'),
            numberFormat: get(xAxis, 'labels.numberFormat'),
            rotation: get(xAxis, 'labels.rotation', 0),
            style: labelsStyle,
            width: 0,
            height: 0,
            lineHeight: labelsLineHeight,
            maxWidth:
                calculateNumericProperty({base: width, value: xAxis?.labels?.maxWidth}) ??
                axisLabelsDefaults.maxWidth,
            html: labelsHtml,
        },
        lineColor: get(xAxis, 'lineColor'),
        categories: getAxisCategories(xAxis),
        timestamps: get(xAxis, 'timestamps'),
        title: {
            text: titleText,
            style: titleStyle,
            margin: get(xAxis, 'title.margin', xAxisTitleDefaults.margin),
            height: titleSize.maxHeight * estimatedTitleRows.length,
            width: titleSize.maxWidth,
            align: get(xAxis, 'title.align', xAxisTitleDefaults.align),
            maxRowCount: get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount),
        },
        min: get(xAxis, 'min'),
        max: get(xAxis, 'max'),
        maxPadding: shouldHideGrid ? 0 : get(xAxis, 'maxPadding', 0.01),
        grid: {
            enabled: shouldHideGrid ? false : get(xAxis, 'grid.enabled', true),
        },
        ticks: {
            pixelInterval: xAxis?.ticks?.interval
                ? calculateNumericProperty({
                      base: width,
                      value: xAxis.ticks.interval,
                  })
                : xAxis?.ticks?.pixelInterval,
        },
        position: 'bottom',
        plotIndex: 0,
        plotLines: get(xAxis, 'plotLines', []).map((d) => ({
            value: get(d, 'value', 0),
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            width: get(d, 'width', 1),
            dashStyle: get(d, 'dashStyle', DASH_STYLE.Solid),
            opacity: get(d, 'opacity', 1),
            layerPlacement: get(d, 'layerPlacement', 'before'),
            label: prepareAxisPlotLabel(d),
        })),
        plotBands: get(xAxis, 'plotBands', []).map((d) => ({
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            opacity: get(d, 'opacity', 1),
            from: get(d, 'from', 0),
            to: get(d, 'to', 0),
            layerPlacement: get(d, 'layerPlacement', 'before'),
            label: prepareAxisPlotLabel(d),
        })),
        crosshair: {
            enabled: get(xAxis, 'crosshair.enabled', axisCrosshairDefaults.enabled),
            color: get(xAxis, 'crosshair.color', axisCrosshairDefaults.color),
            layerPlacement: get(
                xAxis,
                'crosshair.layerPlacement',
                axisCrosshairDefaults.layerPlacement,
            ),
            snap: get(xAxis, 'crosshair.snap', axisCrosshairDefaults.snap),
            dashStyle: get(xAxis, 'crosshair.dashStyle', axisCrosshairDefaults.dashStyle),
            width: get(xAxis, 'crosshair.width', axisCrosshairDefaults.width),
            opacity: get(xAxis, 'crosshair.opacity', axisCrosshairDefaults.opacity),
        },
        visible: get(xAxis, 'visible', true),
        order: xAxis?.order,
    };

    await setLabelSettings({
        axis: preparedXAxis,
        seriesData,
        seriesOptions,
        width,
        autoRotation: xAxis?.labels?.autoRotation,
    });

    return preparedXAxis;
};
