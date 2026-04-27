import type {HtmlItem, LabelData, ShapeDataWithLabels} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import type {PreparedSplit} from '../../../layout/split-types';
import type {ChartScale} from '../../../scales/types';
import {prepareAnnotation} from '../../../series/prepare-annotation';
import type {
    AnnotationAnchor,
    PreparedLineSeries,
    PreparedSeriesOptions,
} from '../../../series/types';
import {filterOverlappingLabels, preparePointDataLabels} from '../../../utils';
import {getXValue, getYValue, markHiddenPointsOutOfYRange} from '../shared/utils';

import type {MarkerData, MarkerPointData, PointData, PreparedLineData} from './types';

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
            const labelsData = await preparePointDataLabels({
                series: s,
                points,
                xMax,
                yAxisTop,
                isOutsideBounds,
            });
            svgLabels = labelsData.svgLabels;
            htmlElements = labelsData.htmlLabels;
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
        const annotations = points.reduce<AnnotationAnchor[]>((result, p) => {
            if (p.annotation && p.x !== null && p.y !== null) {
                result.push({annotation: p.annotation, x: p.x, y: p.y});
            }
            return result;
        }, []);

        markHiddenPointsOutOfYRange({
            points,
            yScale: seriesYScale,
            yAxisTop,
            axisMin: seriesYAxis.min,
            axisMax: seriesYAxis.max,
            getDataY: (p) => p.data.y,
        });

        const result: PreparedLineData = {
            type: 'line',
            annotations,
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
