import get from 'lodash/get';

import {
    TIME_UNITS,
    calculateCos,
    calculateNumericProperty,
    calculateSin,
    formatAxisTickLabel,
    getDefaultDateFormat,
    getHorizontalHtmlTextHeight,
    getLabelsSize,
    getMinSpaceBetween,
    getTextSizeFn,
    isAxisRelatedSeries,
    wrapText,
} from '~core/utils';

import type {BaseTextStyle, ChartAxisLabels, ChartSeries, ChartXAxis} from '../../types';
import {
    DASH_STYLE,
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    SERIES_TYPE,
    axisCrosshairDefaults,
    axisLabelsDefaults,
    axisTickMarksDefaults,
    xAxisTitleDefaults,
} from '../constants';
import {createXScale} from '../scales/x-scale';
import {getXAxisTickValues} from '../utils/axis/x-axis';

import {getPreparedRangeSlider} from './range-slider';
import type {PreparedXAxis} from './types';
import {prepareAxisPlotLabel} from './utils';

async function setLabelSettings({
    axis,
    seriesData,
    width,
    axisLabels,
}: {
    axis: PreparedXAxis;
    seriesData: ChartSeries[];
    width: number;
    axisLabels?: ChartAxisLabels;
}) {
    const scale = createXScale({axis, series: seriesData, boundsWidth: width});

    if (!scale) {
        axis.labels.height = 0;
        axis.labels.rotation = 0;
        return;
    }

    const getTextSize = getTextSizeFn({style: axis.labels.style});
    const labelLineHeight = (await getTextSize('Tmp')).height;
    const tickValues = getXAxisTickValues({axis, scale, labelLineHeight, series: seriesData});
    const tickStep = getMinSpaceBetween(tickValues as {value: unknown}[], (d) => Number(d.value));
    if (axis.type === 'datetime' && !axisLabels?.dateFormat && tickStep >= TIME_UNITS.day) {
        axis.labels.dateFormat = getDefaultDateFormat(tickStep);
    }
    const labels = tickValues.map((tick) =>
        formatAxisTickLabel({
            axis,
            value: tick.value,
            step: tickStep,
        }),
    );
    const labelMaxWidth =
        tickValues.length > 1
            ? getMinSpaceBetween<{x: number}>(tickValues, (d) => d.x) - axis.labels.padding * 2
            : width;
    const hasOverlappingLabels = async () => {
        for (let i = 0; i < labels.length; i++) {
            const size = await getTextSize(labels[i]);
            if (size.width > labelMaxWidth) {
                return true;
            }
        }

        return false;
    };

    const autoRotation = axisLabels?.autoRotation ?? axis.type !== 'datetime';
    const overlapping = axis.labels.html ? false : await hasOverlappingLabels();
    const defaultRotation = overlapping && autoRotation ? -45 : 0;
    const rotation = axis.labels.html ? 0 : (axisLabels?.rotation ?? defaultRotation);
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
    const maxHeight = rotation
        ? Math.abs(calculateSin(rotation)) * axis.labels.maxWidth +
          Math.abs(calculateCos(rotation)) * axis.labels.lineHeight
        : labelsHeight;

    axis.labels.height = Math.min(maxHeight, labelsHeight);
    axis.labels.rotation = rotation;
}

function getMaxPaddingBySeries({series}: {series: ChartSeries[]}) {
    if (series.some((s) => s.type === SERIES_TYPE.Heatmap)) {
        return 0;
    }

    return 0.01;
}

export const getPreparedXAxis = async ({
    xAxis,
    seriesData,
    width,
    boundsWidth,
}: {
    xAxis?: ChartXAxis;
    seriesData: ChartSeries[];
    width: number;
    boundsWidth: number;
}): Promise<PreparedXAxis | null> => {
    const hasAxisRelatedSeries = seriesData.some(isAxisRelatedSeries);
    if (!hasAxisRelatedSeries) {
        return Promise.resolve(null);
    }

    const isAxisVisible = xAxis?.visible ?? true;

    const titleText = isAxisVisible ? get(xAxis, 'title.text', '') : '';
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

    const isLabelsEnabled = isAxisVisible && (xAxis?.labels?.enabled ?? true);
    const labelsStyle = {
        fontSize: get(xAxis, 'labels.style.fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE),
    };
    const labelsHtml = xAxis?.labels?.html ?? false;
    let labelsLineHeight = 0;
    if (isLabelsEnabled) {
        labelsLineHeight = labelsHtml
            ? getHorizontalHtmlTextHeight({text: 'Tmp', style: labelsStyle})
            : (await getTextSizeFn({style: labelsStyle})('Tmp')).height;
    }

    const shouldHideGrid =
        isAxisVisible === false || seriesData.some((s) => s.type === SERIES_TYPE.Heatmap);
    const preparedRangeSlider = getPreparedRangeSlider({xAxis});
    const maxPadding = preparedRangeSlider.enabled
        ? 0
        : get(xAxis, 'maxPadding', getMaxPaddingBySeries({series: seriesData}));

    const preparedXAxis: PreparedXAxis = {
        type: get(xAxis, 'type', 'linear'),
        labels: {
            enabled: isLabelsEnabled,
            margin: isLabelsEnabled ? get(xAxis, 'labels.margin', axisLabelsDefaults.margin) : 0,
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
        categories: xAxis?.categories,
        timestamps: get(xAxis, 'timestamps'),
        title: {
            text: titleText,
            style: titleStyle,
            margin: get(xAxis, 'title.margin', xAxisTitleDefaults.margin),
            height: titleSize.maxHeight * estimatedTitleRows.length,
            width: titleSize.maxWidth,
            align: get(xAxis, 'title.align', xAxisTitleDefaults.align),
            maxRowCount: get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount),
            rotation: 0,
            maxWidth: Infinity,
            html: false,
        },
        min: get(xAxis, 'min'),
        max: get(xAxis, 'max'),
        startOnTick: get(xAxis, 'startOnTick'),
        endOnTick: get(xAxis, 'endOnTick'),
        maxPadding,
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
        tickMarks: {
            enabled:
                isAxisVisible && get(xAxis, 'tickMarks.enabled', axisTickMarksDefaults.enabled),
            length: get(xAxis, 'tickMarks.length', axisTickMarksDefaults.length),
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
            custom: d.custom,
            label: prepareAxisPlotLabel(d),
        })),
        plotBands: get(xAxis, 'plotBands', []).map((d) => ({
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            opacity: get(d, 'opacity', 1),
            from: get(d, 'from', 0),
            to: get(d, 'to', 0),
            layerPlacement: get(d, 'layerPlacement', 'before'),
            custom: d.custom,
            label: prepareAxisPlotLabel(d),
        })),
        // x, y and hitbox are populated later in prepare-axis-data
        // after pixel coordinates and element dimensions are computed
        plotShapes: get(xAxis, 'plotShapes', []).map((d) => ({
            custom: d.custom,
            hitbox: {x: 0, y: 0, width: 0, height: 0},
            layerPlacement: get(d, 'layerPlacement', 'before'),
            opacity: get(d, 'opacity', 1),
            renderer: d.renderer,
            value: d.value,
            x: 0,
            y: 0,
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
        visible: isAxisVisible,
        order: xAxis?.order,
        rangeSlider: preparedRangeSlider,
    };

    if (isLabelsEnabled) {
        await setLabelSettings({
            axis: preparedXAxis,
            seriesData,
            width: boundsWidth,
            axisLabels: xAxis?.labels,
        });
    }

    return preparedXAxis;
};
