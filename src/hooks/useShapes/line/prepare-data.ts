import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import {prepareAnnotation} from '~core/series/prepare-annotation';
import {filterOverlappingLabels, getLabelsSize, getTextSizeFn} from '~core/utils';
import {getFormattedValue} from '~core/utils/format';

import type {HtmlItem, LabelData, ShapeDataWithLabels} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import type {PreparedLineSeries, PreparedSeriesOptions} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {MarkerData, MarkerPointData, PointData, PreparedLineData} from './types';

async function getHtmlLabel(
    point: MarkerPointData,
    series: PreparedLineSeries,
    xMax: number,
): Promise<HtmlItem> {
    const content = String(point.data.label ?? point.data.y);
    const size = await getLabelsSize({labels: [content], html: true});
    const width = size.maxWidth;

    return {
        x: Math.min(xMax - size.maxWidth, Math.max(0, point.x - width / 2)),
        y: Math.max(0, point.y - series.dataLabels.padding - size.maxHeight),
        content,
        size: {width, height: size.maxHeight},
        style: series.dataLabels.style,
    };
}

export const prepareLineData = async (args: {
    series: PreparedLineSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers: ShapeDataWithLabels[];
}): Promise<PreparedLineData[]> => {
    const {
        series,
        seriesOptions,
        xAxis,
        yAxis,
        xScale,
        yScale,
        split,
        isOutsideBounds,
        isRangeSlider,
        otherLayers,
    } = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax;

    const acc: PreparedLineData[] = [];
    for (let i = 0; i < series.length; i++) {
        const s = series[i];
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;
        const seriesYScale = yScale[s.yAxis];

        if (!seriesYScale) {
            continue;
        }
        const annotationOpts = seriesOptions?.line?.annotation;
        const points: PointData[] = [];
        for (let j = 0; j < s.data.length; j++) {
            const d = s.data[j];
            const yValue = getYValue({
                point: d,
                points: s.data,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
            });
            points.push({
                x: getXValue({point: d, points: s.data, xAxis, xScale}),
                y: yValue === null ? null : yAxisTop + yValue,
                color: d.marker?.color ?? d.color,
                data: d,
                series: s,
                annotation:
                    d.annotation && !isRangeSlider
                        ? await prepareAnnotation({
                              annotation: d.annotation,
                              optionsLabel: annotationOpts?.label,
                              optionsPopup: annotationOpts?.popup,
                          })
                        : undefined,
            });
        }

        let htmlElements: HtmlItem[] = [];
        let svgLabels: LabelData[] = [];
        if (s.dataLabels.enabled && !isRangeSlider) {
            if (s.dataLabels.html) {
                const list = await Promise.all(
                    points.reduce<Promise<HtmlItem>[]>((result, p) => {
                        if (p.y === null || p.x === null || isOutsideBounds(p.x, p.y)) {
                            return result;
                        }
                        result.push(getHtmlLabel(p as MarkerPointData, s, xMax));
                        return result;
                    }, []),
                );
                htmlElements.push(...list);
            } else {
                const getTextSize = getTextSizeFn({style: s.dataLabels.style});
                for (let index = 0; index < points.length; index++) {
                    const point = points[index];

                    if (
                        point.y !== null &&
                        point.x !== null &&
                        !isOutsideBounds(point.x, point.y)
                    ) {
                        const labelValue = point.data.label ?? point.data.y;
                        const text = getFormattedValue({
                            value: labelValue,
                            ...s.dataLabels,
                        });
                        const labelSize = await getTextSize(text);

                        const style = s.dataLabels.style;

                        const y = Math.max(
                            yAxisTop,
                            point.y -
                                s.dataLabels.padding -
                                labelSize.height +
                                labelSize.hangingOffset,
                        );
                        const x = Math.min(
                            xMax - labelSize.width,
                            Math.max(0, point.x - labelSize.width / 2),
                        );
                        const labelData: LabelData = {
                            text,
                            x,
                            y,
                            style,
                            size: labelSize,
                            textAnchor: 'start',
                            series: s,
                            active: true,
                        };

                        svgLabels.push(labelData);
                    }
                }
            }
        }

        if (!s.dataLabels.allowOverlap) {
            svgLabels = filterOverlappingLabels(
                svgLabels,
                otherLayers.map((l) => l.svgLabels).flat(),
            );
            htmlElements = filterOverlappingLabels(
                htmlElements,
                otherLayers.map((l) => l.htmlLabels).flat(),
            );
        }

        let markers: MarkerData[] = [];
        const hasPerPointNormalMarkers = s.data.some((d) => d.marker?.states?.normal?.enabled);

        if (s.marker.states.normal.enabled || hasPerPointNormalMarkers) {
            markers = points.reduce<MarkerData[]>((result, p) => {
                if (p.y === null || p.x === null) {
                    return result;
                }

                const pointNormalEnabled = p.data.marker?.states?.normal?.enabled ?? false;

                if (s.marker.states.normal.enabled || pointNormalEnabled) {
                    result.push({
                        point: p as MarkerPointData,
                        active: true,
                        hovered: false,
                        clipped: isOutsideBounds(p.x, p.y),
                    });
                }

                return result;
            }, []);
        }
        const result: PreparedLineData = {
            points,
            markers,
            svgLabels: svgLabels,
            series: s,
            hovered: false,
            active: true,
            id: s.id,
            htmlLabels: htmlElements,
            color: s.color,
            lineWidth: (isRangeSlider ? s.rangeSlider.lineWidth : undefined) ?? s.lineWidth,
            dashStyle: s.dashStyle,
            linecap: s.linecap,
            linejoin: s.linejoin,
            opacity: (isRangeSlider ? s.rangeSlider.opacity : undefined) ?? s.opacity,
        };

        acc.push(result);
    }

    return acc;
};
