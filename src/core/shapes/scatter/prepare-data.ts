import get from 'lodash/get';

import type {HtmlItem, ScatterSeriesData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedScatterSeries} from '../../series/types';
import {createIsOutsideBounds, getXValue, getYValue} from '../../shapes/utils';
import {
    filterOverlappingLabels,
    getDataCategoryValue,
    getFormattedValue,
    getLabelRect,
    getTextSizeFn,
    preparePointDataLabels,
    shouldPrepareSeriesDataLabels,
} from '../../utils';
import type {LabelRect} from '../types';

import {clusterSeriesData} from './cluster';
import type {PreparedScatterData, PreparedScatterShapeData, ScatterSvgLabelData} from './types';

function getFilteredLinearScatterData(data: ScatterSeriesData[]) {
    return data.filter((d) => typeof d.x === 'number' && typeof d.y === 'number');
}

function getFilteredCategoryScatterData(args: {
    data: ScatterSeriesData[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis;
    yScale: ChartScale;
}) {
    const {data, xAxis, xScale, yAxis, yScale} = args;
    const xDomain = xScale.domain();
    const xCategories = get(xAxis, 'categories', [] as string[]);
    const yDomain = yScale.domain();
    const yCategories = get(yAxis, 'categories', [] as string[]);

    return data.filter((d) => {
        let xInRange = true;
        let yInRange = true;

        if (xAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'x',
                categories: xCategories,
                data: d,
            });
            xInRange = (xDomain as string[]).indexOf(dataCategory) !== -1;
        }

        if (yAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'y',
                categories: yCategories,
                data: d,
            });
            yInRange = (yDomain as string[]).indexOf(dataCategory) !== -1;
        }

        return xInRange && yInRange;
    });
}

export async function prepareScatterData(args: {
    series: PreparedScatterSeries[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
    boundsWidth: number;
    boundsHeight: number;
    isRangeSlider?: boolean;
}): Promise<PreparedScatterShapeData> {
    const {
        series,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split,
        isOutsideBounds,
        boundsWidth,
        boundsHeight,
        isRangeSlider,
    } = args;

    const xMax = Math.max(...xScale.range());

    const scatterDataBySeries = new Map<string, PreparedScatterData[]>();
    const markers: PreparedScatterData[] = series.reduce<PreparedScatterData[]>((acc, s) => {
        const seriesMarkers: PreparedScatterData[] = [];
        scatterDataBySeries.set(s.id, seriesMarkers);
        const yAxisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[yAxisIndex];
        const seriesYScale = yScale[yAxisIndex];

        if (!seriesYScale) {
            return acc;
        }
        const plot = split.plots?.[seriesYAxis.plotIndex];
        const plotTop = plot?.top ?? 0;
        const isOutsidePlotBounds = createIsOutsideBounds({
            boundsWidth,
            boundsHeight: plot?.height ?? boundsHeight,
        });

        const filteredData =
            xAxis.type === 'category' || seriesYAxis.type === 'category'
                ? getFilteredCategoryScatterData({
                      data: s.data,
                      xAxis,
                      xScale,
                      yAxis: seriesYAxis,
                      yScale: seriesYScale,
                  })
                : getFilteredLinearScatterData(s.data);

        filteredData.forEach((d) => {
            const x = getXValue({point: d, xAxis, xScale});
            const y = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});

            if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) {
                return;
            }
            const plotY = y + plotTop;

            const marker: PreparedScatterData = {
                point: {
                    data: d,
                    sourceData: s.sourceData?.get(d) ?? d,
                    series: s,
                    x,
                    y: plotY,
                    opacity: get(d, 'opacity', null),
                    color: d.color ?? s.color,
                },
                hovered: false,
                active: true,
                htmlElements: [],
                clipped: isOutsideBounds(x, plotY) || isOutsidePlotBounds(x, y),
            };
            acc.push(marker);
            seriesMarkers.push(marker);
        });

        return acc;
    }, []);

    const scatterData =
        isRangeSlider || !series.some((item) => item.cluster.enabled)
            ? markers
            : series.flatMap((item) => {
                  const seriesMarkers = scatterDataBySeries.get(item.id) ?? [];
                  if (!item.cluster.enabled) {
                      return seriesMarkers;
                  }
                  const plot = split.plots?.[yAxis[item.yAxis].plotIndex];
                  const boundsTop = plot?.top ?? 0;
                  const plotHeight = plot?.height ?? boundsHeight;
                  const isOutsidePlotBounds = createIsOutsideBounds({
                      boundsWidth,
                      boundsHeight: plotHeight,
                  });
                  const clustered = clusterSeriesData({
                      data: seriesMarkers,
                      series: item,
                      boundsWidth,
                      boundsHeight: plotHeight,
                      boundsTop,
                      isOutsideBounds: (x, y) =>
                          isOutsideBounds(x, y) || isOutsidePlotBounds(x, y - boundsTop),
                  });
                  scatterDataBySeries.set(item.id, clustered);
                  return clustered;
              });

    const allSvgLabels: ScatterSvgLabelData[] = [];
    const allHtmlLabels: HtmlItem[] = [];
    const labelBounds: LabelRect[] = [];
    const textSizes = new Map<string, ReturnType<typeof getTextSizeFn>>();
    for (const item of scatterData) {
        const {data, series: itemSeries} = item.point;
        if (item.clipped || !data.cluster || !itemSeries.cluster.dataLabels.enabled) {
            continue;
        }
        const {style, format, allowOverlap} = itemSeries.cluster.dataLabels;
        const text = getFormattedValue({value: data.cluster.size, format});
        let getTextSize = textSizes.get(itemSeries.id);
        if (!getTextSize) {
            getTextSize = getTextSizeFn({style});
            textSizes.set(itemSeries.id, getTextSize);
        }
        const size = await getTextSize(text);
        const label: ScatterSvgLabelData = {
            cluster: true,
            text,
            x: item.point.x,
            y: item.point.y + size.height / 2,
            textAnchor: 'middle',
            style,
            size,
            series: {id: itemSeries.id},
        };
        const bounds: LabelRect = {
            x: label.x - size.width / 2,
            y: item.point.y - size.height / 2,
            size,
        };
        if (allowOverlap || filterOverlappingLabels([bounds], labelBounds).length) {
            allSvgLabels.push(label);
            labelBounds.push(bounds);
        }
    }

    if (!isRangeSlider) {
        for (const s of series) {
            if (!shouldPrepareSeriesDataLabels(s)) {
                continue;
            }

            const yAxisIndex = get(s, 'yAxis', 0);
            const seriesYAxis = yAxis[yAxisIndex];
            const seriesYScale = yScale[yAxisIndex];

            if (!seriesYScale) {
                continue;
            }

            const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;

            const seriesPoints = (scatterDataBySeries.get(s.id) ?? [])
                .filter((m) => !m.clipped)
                .filter((m) => !m.point.data.cluster)
                .map((m) => m.point);

            const {svgLabels, htmlLabels} = await preparePointDataLabels({
                getFormatContext: () => ({}),
                series: s,
                points: seriesPoints,
                xMax,
                yAxisTop,
                isOutsideBounds,
                getAnchorYOffset: (point) =>
                    get(point.data, 'radius', s.marker.states.normal.radius),
            });

            if (s.dataLabels.allowOverlap) {
                allSvgLabels.push(...svgLabels);
                allHtmlLabels.push(...htmlLabels);
                labelBounds.push(...svgLabels.map(getLabelRect), ...htmlLabels);
            } else {
                const keptSvgLabels = filterOverlappingLabels(
                    svgLabels.map((label) => ({...getLabelRect(label), label})),
                    labelBounds,
                );
                allSvgLabels.push(...keptSvgLabels.map(({label}) => label));
                labelBounds.push(...keptSvgLabels);
                const keptHtmlLabels = filterOverlappingLabels(htmlLabels, labelBounds);
                allHtmlLabels.push(...keptHtmlLabels);
                labelBounds.push(...keptHtmlLabels);
            }
        }
    }

    return {
        scatterData,
        svgLabels: allSvgLabels,
        htmlLabels: allHtmlLabels,
        markers: [],
        getHoverMarkers: () => [],
        annotations: [],
    };
}
