import get from 'lodash/get';

import type {HtmlItem, LabelData, ScatterClusterData, ScatterSeriesData} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import type {ChartScale} from '../../scales/types';
import type {PreparedScatterSeries} from '../../series/types';
import {getXValue, getYValue} from '../../shapes/utils';
import {
    filterOverlappingLabels,
    getDataCategoryValue,
    getFormattedValue,
    preparePointDataLabels,
} from '../../utils';

import type {PreparedScatterData, PreparedScatterShapeData} from './types';

function findRoot(parent: number[], index: number): number {
    let root = index;

    while (parent[root] !== root) {
        root = parent[root];
    }

    let current = index;

    while (parent[current] !== current) {
        const next = parent[current];
        parent[current] = root;
        current = next;
    }

    return root;
}

function joinRoots(parent: number[], left: number, right: number) {
    const leftRoot = findRoot(parent, left);
    const rightRoot = findRoot(parent, right);

    if (leftRoot !== rightRoot) {
        parent[rightRoot] = leftRoot;
    }
}

function getAverageValue(
    points: PreparedScatterData[],
    key: 'x' | 'y',
): string | number | null | undefined {
    const values = points.map((item) => item.point.data[key]);

    if (values.every((value) => typeof value === 'number')) {
        return (values as number[]).reduce((sum, value) => sum + value, 0) / values.length;
    }

    return values[0];
}

function makeCluster(
    points: PreparedScatterData[],
    series: PreparedScatterSeries,
    isOutsideBounds: (x: number, y: number) => boolean,
): PreparedScatterData {
    const x = points.reduce((sum, item) => sum + item.point.x, 0) / points.length;
    const y = points.reduce((sum, item) => sum + item.point.y, 0) / points.length;
    const clusteredData = points.map((item) => item.point.data as ScatterSeriesData);
    const data: ScatterClusterData = {
        x: getAverageValue(points, 'x'),
        y: getAverageValue(points, 'y'),
        clusterSize: points.length,
        clusteredData,
        color: series.cluster.marker.color ?? series.color,
        radius: series.cluster.marker.radius,
    };

    return {
        point: {
            data,
            series,
            x,
            y,
            opacity: null,
            color: data.color ?? series.color,
        },
        hovered: false,
        active: true,
        htmlElements: [],
        clipped: isOutsideBounds(x, y),
    };
}

function clusterSeriesData(
    data: PreparedScatterData[],
    series: PreparedScatterSeries,
    isOutsideBounds: (x: number, y: number) => boolean,
) {
    if (!series.cluster.enabled) {
        return data;
    }

    const visibleData = data.filter((item) => !item.clipped);
    const parent = visibleData.map((_, index) => index);
    const cells = new Map<string, number[]>();
    const distance = series.cluster.distance;

    for (let index = 0; index < visibleData.length; index++) {
        const point = visibleData[index].point;
        const cellX = Math.floor(point.x / distance);
        const cellY = Math.floor(point.y / distance);

        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                const candidates = cells.get(`${cellX + offsetX}:${cellY + offsetY}`) ?? [];

                for (const candidateIndex of candidates) {
                    const candidate = visibleData[candidateIndex].point;

                    if (Math.hypot(point.x - candidate.x, point.y - candidate.y) <= distance) {
                        joinRoots(parent, index, candidateIndex);
                    }
                }
            }
        }

        const key = `${cellX}:${cellY}`;
        const cell = cells.get(key) ?? [];
        cell.push(index);
        cells.set(key, cell);
    }

    const groups = new Map<number, PreparedScatterData[]>();

    for (let index = 0; index < visibleData.length; index++) {
        const root = findRoot(parent, index);
        const group = groups.get(root) ?? [];
        group.push(visibleData[index]);
        groups.set(root, group);
    }

    const groupByPoint = new Map<PreparedScatterData, PreparedScatterData[]>();

    for (const group of groups.values()) {
        for (const point of group) {
            groupByPoint.set(point, group);
        }
    }

    const emittedGroups = new Set<PreparedScatterData[]>();
    const result: PreparedScatterData[] = [];

    for (const point of data) {
        const group = groupByPoint.get(point);

        if (!group || group.length < series.cluster.minimumClusterSize) {
            result.push(point);
        } else if (!emittedGroups.has(group)) {
            result.push(makeCluster(group, series, isOutsideBounds));
            emittedGroups.add(group);
        }
    }

    return result;
}

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
    isRangeSlider?: boolean;
}): Promise<PreparedScatterShapeData> {
    const {series, xAxis, xScale, yAxis, yScale, split, isOutsideBounds, isRangeSlider} = args;

    const xMax = Math.max(...xScale.range());

    const markers: PreparedScatterData[] = series.reduce<PreparedScatterData[]>((acc, s) => {
        const yAxisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[yAxisIndex];
        const seriesYScale = yScale[yAxisIndex];

        if (!seriesYScale) {
            return acc;
        }

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

            acc.push({
                point: {
                    data: d,
                    series: s,
                    x,
                    y,
                    opacity: get(d, 'opacity', null),
                    color: d.color ?? s.color,
                },
                hovered: false,
                active: true,
                htmlElements: [],
                clipped: isOutsideBounds(x, y),
            });
        });

        return acc;
    }, []);

    const scatterData = isRangeSlider
        ? markers
        : series.flatMap((item) =>
              clusterSeriesData(
                  markers.filter((marker) => marker.point.series.id === item.id),
                  item,
                  isOutsideBounds,
              ),
          );

    const allSvgLabels: LabelData[] = [];
    const allHtmlLabels: HtmlItem[] = [];
    const clusterLabels = scatterData.flatMap((item) => {
        const {data, series: itemSeries} = item.point;

        if (!('clusteredData' in data) || !itemSeries.cluster.dataLabels.enabled) {
            return [];
        }

        return [
            {
                cluster: true as const,
                text: getFormattedValue({
                    value: data.clusterSize,
                    format: itemSeries.cluster.dataLabels.format,
                }),
                x: item.point.x,
                y: item.point.y,
                textAnchor: 'middle' as const,
                style: itemSeries.cluster.dataLabels.style,
            },
        ];
    });

    if (!isRangeSlider) {
        for (const s of series) {
            if (!s.dataLabels.enabled) {
                continue;
            }

            const yAxisIndex = get(s, 'yAxis', 0);
            const seriesYAxis = yAxis[yAxisIndex];
            const seriesYScale = yScale[yAxisIndex];

            if (!seriesYScale) {
                continue;
            }

            const yAxisTop = split.plots[seriesYAxis.plotIndex]?.top || 0;

            const seriesPoints = scatterData
                .filter((m) => m.point.series.id === s.id && !m.clipped)
                .filter((m) => !('clusteredData' in m.point.data))
                .map((m) => m.point);

            const {svgLabels, htmlLabels} = await preparePointDataLabels({
                series: s,
                points: seriesPoints,
                xMax,
                yAxisTop,
                isOutsideBounds,
                anchorYOffset: s.marker.states.normal.radius,
            });

            if (s.dataLabels.allowOverlap) {
                allSvgLabels.push(...svgLabels);
                allHtmlLabels.push(...htmlLabels);
            } else {
                allSvgLabels.push(...filterOverlappingLabels(svgLabels, allSvgLabels));
                allHtmlLabels.push(...filterOverlappingLabels(htmlLabels, allHtmlLabels));
            }
        }
    }

    return {
        scatterData,
        svgLabels: allSvgLabels,
        clusterLabels,
        htmlLabels: allHtmlLabels,
        markers: [],
        getHoverMarkers: () => [],
        annotations: [],
    };
}
