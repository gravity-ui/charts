import type {AxisDomain, AxisScale} from 'd3';
import get from 'lodash/get';

import {
    DASH_STYLE,
    DEFAULT_AXIS_LABEL_FONT_SIZE,
    axisCrosshairDefaults,
    axisLabelsDefaults,
    xAxisTitleDefaults,
} from '../../constants';
import type {BaseTextStyle, ChartSeries, ChartXAxis} from '../../types';
import {
    calculateCos,
    formatAxisTickLabel,
    getClosestPointsRange,
    getHorisontalSvgTextHeight,
    getLabelsSize,
    getMaxTickCount,
    getTicksCount,
    getXAxisItems,
    hasOverlappingLabels,
    wrapText,
} from '../../utils';
import {createXScale} from '../useAxisScales';

import type {PreparedAxis} from './types';

function getLabelSettings({
    axis,
    series,
    width,
    autoRotation = true,
}: {
    axis: PreparedAxis;
    series: ChartSeries[];
    width: number;
    autoRotation?: boolean;
}) {
    const scale = createXScale(axis, series, width);
    const tickCount = getTicksCount({axis, range: width});
    const ticks = getXAxisItems({
        scale: scale as AxisScale<AxisDomain>,
        count: tickCount,
        maxCount: getMaxTickCount({width, axis}),
    });
    const step = getClosestPointsRange(axis, ticks);
    const labels = ticks.map((value: AxisDomain) => {
        return formatAxisTickLabel({
            axis,
            value,
            step,
        });
    });
    const overlapping = hasOverlappingLabels({
        width,
        labels,
        padding: axis.labels.padding,
        style: axis.labels.style,
    });

    const defaultRotation = overlapping && autoRotation ? -45 : 0;
    const rotation = axis.labels.rotation || defaultRotation;
    const labelsHeight = rotation
        ? getLabelsSize({
              labels,
              style: axis.labels.style,
              rotation,
          }).maxHeight
        : axis.labels.lineHeight;
    const maxHeight = rotation ? calculateCos(rotation) * axis.labels.maxWidth : labelsHeight;

    return {height: Math.min(maxHeight, labelsHeight), rotation};
}

export const getPreparedXAxis = ({
    xAxis,
    series,
    width,
}: {
    xAxis?: ChartXAxis;
    series: ChartSeries[];
    width: number;
}): PreparedAxis => {
    const titleText = get(xAxis, 'title.text', '');
    const titleStyle: BaseTextStyle = {
        ...xAxisTitleDefaults.style,
        ...get(xAxis, 'title.style'),
    };
    const titleMaxRowsCount = get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount);
    const estimatedTitleRows = wrapText({
        text: titleText,
        style: titleStyle,
        width,
    }).slice(0, titleMaxRowsCount);
    const titleSize = getLabelsSize({
        labels: [titleText],
        style: titleStyle,
    });
    const labelsStyle = {
        fontSize: get(xAxis, 'labels.style.fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE),
    };

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
            lineHeight: getHorisontalSvgTextHeight({text: 'Tmp', style: labelsStyle}),
            maxWidth: get(xAxis, 'labels.maxWidth', axisLabelsDefaults.maxWidth),
        },
        lineColor: get(xAxis, 'lineColor'),
        categories: get(xAxis, 'categories'),
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
        maxPadding: get(xAxis, 'maxPadding', 0.01),
        grid: {
            enabled: get(xAxis, 'grid.enabled', true),
        },
        ticks: {
            pixelInterval: get(xAxis, 'ticks.pixelInterval'),
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
        })),
        plotBands: get(xAxis, 'plotBands', []).map((d) => ({
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            opacity: get(d, 'opacity', 1),
            from: get(d, 'from', 0),
            to: get(d, 'to', 0),
            layerPlacement: get(d, 'layerPlacement', 'before'),
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
    };

    const {height, rotation} = getLabelSettings({
        axis: preparedXAxis,
        series,
        width,
        autoRotation: xAxis?.labels?.autoRotation,
    });

    preparedXAxis.labels.height = height;
    preparedXAxis.labels.rotation = rotation;

    return preparedXAxis;
};
