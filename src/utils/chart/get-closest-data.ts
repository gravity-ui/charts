import {Delaunay, bisector, sort} from 'd3';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {PreparedBarXData, PreparedScatterData, ShapeData} from '../../hooks';
import type {PreparedAreaData} from '../../hooks/useShapes/area/types';
import type {PreparedBarYData} from '../../hooks/useShapes/bar-y/types';
import type {PreparedHeatmapData} from '../../hooks/useShapes/heatmap';
import type {PreparedLineData} from '../../hooks/useShapes/line/types';
import type {PreparedPieData} from '../../hooks/useShapes/pie/types';
import type {PreparedRadarData} from '../../hooks/useShapes/radar/types';
import type {PreparedSankeyData} from '../../hooks/useShapes/sankey/types';
import type {PreparedTreemapData} from '../../hooks/useShapes/treemap/types';
import type {PreparedWaterfallData} from '../../hooks/useShapes/waterfall';
import type {
    AreaSeries,
    BarXSeries,
    ChartSeries,
    ChartSeriesData,
    HeatmapSeries,
    LineSeries,
    RadarSeries,
    SankeySeries,
    SankeySeriesData,
    TooltipDataChunk,
    TreemapSeries,
    WaterfallSeries,
    WaterfallSeriesData,
} from '../../types';

type GetClosestPointsArgs = {
    position: [number, number];
    shapesData: ShapeData[];
    boundsHeight: number;
    boundsWidth: number;
};

export type ShapePoint = {
    x: number;
    y0: number;
    y1: number;
    data: ChartSeriesData;
    series: ChartSeries;
    subTotal?: number;
};

function getClosestYIndex(items: ShapePoint[], y: number) {
    let closestYIndex = -1;
    if (y < items[0]?.y0) {
        closestYIndex = 0;
    } else if (y > items[items.length - 1]?.y1) {
        closestYIndex = items.length - 1;
    } else {
        closestYIndex = items.findIndex((p) => y > p.y0 && y < p.y1);
        if (closestYIndex === -1) {
            const sortedY = sort(
                items.map((p, index) => ({index, y: p.y1 + (p.y0 - p.y1) / 2})),
                (p) => p.y,
            );
            const sortedYIndex = bisector<{y: number}, number>((p) => p.y).center(sortedY, y);
            closestYIndex = sortedY[sortedYIndex]?.index ?? -1;
        }
    }

    return closestYIndex;
}

function getClosestPointsByXValue(x: number, y: number, points: ShapePoint[]) {
    const sorted = sort(points, (p) => p.x);
    const closestXIndex = bisector<ShapePoint, number>((p) => p.x).center(sorted, x);

    if (sorted.length === 0 || closestXIndex === -1) {
        return [];
    }

    const closestX = sorted[closestXIndex].x;
    const filtered = points.filter((p) => p.x === closestX);

    const groupedBySeries = Object.values(groupBy(filtered, (p) => get(p.series, 'id'))).map(
        (items) => {
            const sortedByY = sort(items, (p) => p.y0);
            const index = getClosestYIndex(sortedByY, y);
            return sortedByY[index === -1 ? 0 : index];
        },
    );

    const closestPoints = sort(groupedBySeries, (p) => p.y0);
    const closestYIndex = getClosestYIndex(closestPoints, y);
    return closestPoints.map((p, i) => ({
        ...p,
        closest: i === closestYIndex,
    }));
}

function getSeriesType(shapeData: ShapeData) {
    return (
        get(shapeData, 'series.type') ||
        get(shapeData, 'point.series.type') ||
        get(shapeData, 'type')
    );
}

export function getClosestPoints(args: GetClosestPointsArgs): TooltipDataChunk[] {
    const {position, shapesData, boundsHeight, boundsWidth} = args;
    const [pointerX, pointerY] = position;

    const result: TooltipDataChunk[] = [];
    const groups = groupBy(shapesData, getSeriesType);

    // eslint-disable-next-line complexity
    Object.entries(groups).forEach(([seriesType, list]) => {
        switch (seriesType) {
            case 'bar-x': {
                const points = (list as PreparedBarXData[]).map<ShapePoint>((d) => ({
                    data: d.data,
                    series: d.series as BarXSeries,
                    x: d.x + d.width / 2,
                    y0: d.y,
                    y1: d.y + d.height,
                }));
                result.push(
                    ...(getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[]),
                );

                break;
            }
            case 'waterfall': {
                const points = (list as PreparedWaterfallData[]).map<ShapePoint>((d) => ({
                    data: d.data as WaterfallSeriesData,
                    series: d.series as WaterfallSeries,
                    x: d.x + d.width / 2,
                    y0: d.y,
                    y1: d.y + d.height,
                    subTotal: d.subTotal,
                }));
                result.push(
                    ...(getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[]),
                );

                break;
            }
            case 'area': {
                const points = (list as PreparedAreaData[]).reduce<ShapePoint[]>((acc, d) => {
                    Array.prototype.push.apply(
                        acc,
                        d.points.map((p) => ({
                            data: p.data,
                            series: p.series as AreaSeries,
                            x: p.x,
                            y0: p.y0,
                            y1: p.y,
                        })),
                    );
                    return acc;
                }, []);
                result.push(
                    ...(getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[]),
                );
                break;
            }
            case 'line': {
                const points = (list as PreparedLineData[]).reduce<ShapePoint[]>((acc, d) => {
                    acc.push(
                        ...d.points.map((p) => ({
                            data: p.data,
                            series: p.series as LineSeries,
                            x: p.x,
                            y0: p.y,
                            y1: p.y,
                        })),
                    );
                    return acc;
                }, []);
                result.push(
                    ...(getClosestPointsByXValue(pointerX, pointerY, points) as TooltipDataChunk[]),
                );
                break;
            }
            case 'bar-y': {
                const points = list as PreparedBarYData[];
                const sorted = sort(points, (p) => p.y);
                const closestYIndex = bisector<PreparedBarYData, number>(
                    (p) => p.y + p.height / 2,
                ).center(sorted, pointerY);

                const closestYPoint = sorted[closestYIndex];

                let selectedPoints: PreparedBarYData[] = [];
                let closestPointXValue: number | undefined = -1;
                if (closestYPoint) {
                    selectedPoints = points.filter((p) => p.data.y === closestYPoint.data.y);

                    const closestPoints = sort(
                        selectedPoints.filter((p) => p.y === closestYPoint.y),
                        (p) => p.x,
                    );

                    const lastPoint = closestPoints[closestPoints.length - 1];
                    if (pointerX < closestPoints[0]?.x) {
                        closestPointXValue = closestPoints[0].x;
                    } else if (lastPoint && pointerX > lastPoint.x + lastPoint.width) {
                        closestPointXValue = lastPoint.x;
                    } else {
                        closestPointXValue = closestPoints.find(
                            (p) => pointerX > p.x && pointerX < p.x + p.width,
                        )?.x;
                    }
                }

                result.push(
                    ...(selectedPoints.map((p) => ({
                        data: p.data,
                        series: p.series,
                        closest: p.x === closestPointXValue && p.y === closestYPoint.y,
                    })) as TooltipDataChunk[]),
                );
                break;
            }
            case 'scatter': {
                const points = list as PreparedScatterData[];
                const delaunayX = Delaunay.from(
                    points,
                    (d) => d.point.x,
                    (d) => d.point.y,
                );
                const closestPoint = points[delaunayX.find(pointerX, pointerY)];
                if (closestPoint) {
                    result.push({
                        data: closestPoint.point.data,
                        series: closestPoint.point.series,
                        closest: true,
                    });
                }

                break;
            }
            case 'pie': {
                const points = (list as PreparedPieData[]).map((d) => d.segments).flat();
                const closestPoint = points.find((p) => {
                    const {center} = p.data.pie;
                    const x = pointerX - center[0];
                    const y = pointerY - center[1];
                    let angle = Math.atan2(y, x) + 0.5 * Math.PI;
                    angle = angle < 0 ? Math.PI * 2 + angle : angle;
                    const polarRadius = getRadius({center, pointer: [pointerX, pointerY]});

                    return (
                        angle >= p.startAngle && angle <= p.endAngle && polarRadius < p.data.radius
                    );
                });

                if (closestPoint) {
                    result.push({
                        data: closestPoint.data.series.data,
                        series: closestPoint.data.series,
                        closest: true,
                    });
                }

                break;
            }
            case 'treemap': {
                const data = list as unknown as PreparedTreemapData[];
                const closestPoint = data[0]?.leaves.find((l) => {
                    return (
                        pointerX >= l.x0 && pointerX <= l.x1 && pointerY >= l.y0 && pointerY <= l.y1
                    );
                });
                if (closestPoint) {
                    result.push({
                        data: closestPoint.data,
                        series: data[0].series as unknown as TreemapSeries,
                        closest: true,
                    });
                }

                break;
            }
            case 'heatmap': {
                const data = list as unknown as PreparedHeatmapData[];
                const closestPoint = data[0]?.items.find((cell) => {
                    return (
                        pointerX >= cell.x &&
                        pointerX <= cell.x + cell.width &&
                        pointerY >= cell.y &&
                        pointerY <= cell.y + cell.height
                    );
                });
                if (closestPoint) {
                    result.push({
                        data: closestPoint.data,
                        series: data[0].series as unknown as HeatmapSeries,
                        closest: true,
                    });
                }

                break;
            }
            case 'sankey': {
                const [data] = list as unknown as PreparedSankeyData[];
                const closestLink = data.links.find((d) => {
                    return isInsidePath({
                        path: d.path ?? '',
                        strokeWidth: d.strokeWidth,
                        point: [pointerX, pointerY],
                        width: boundsWidth,
                        height: boundsHeight,
                    });
                });
                if (closestLink) {
                    result.push({
                        data: closestLink.source as SankeySeriesData,
                        target: closestLink.target,
                        series: data.series as SankeySeries,
                        closest: true,
                    });
                }

                break;
            }
            case 'radar': {
                const [radarData] = list as unknown as PreparedRadarData[];

                const radius = getRadius({center: radarData.center, pointer: [pointerX, pointerY]});
                if (radius <= radarData.radius) {
                    const radarShapes = radarData.shapes.filter((shape) =>
                        isInsidePath({
                            path: shape.path,
                            point: [pointerX, pointerY],
                            width: boundsWidth,
                            height: boundsHeight,
                            strokeWidth: shape.borderWidth,
                        }),
                    );
                    const points = radarShapes.map((shape) => shape.points).flat();
                    const delaunayX = Delaunay.from(
                        points,
                        (d) => d.position[0],
                        (d) => d.position[1],
                    );
                    const closestPoint = points[delaunayX.find(pointerX, pointerY)];
                    if (closestPoint) {
                        radarData.shapes.forEach((shape) => {
                            result.push({
                                data: shape.points[closestPoint.index].data,
                                series: shape.series as RadarSeries,
                                category: shape.series.categories[closestPoint.index],
                                closest: shape.series === closestPoint.series,
                            });
                        });
                    }
                }

                break;
            }
        }
    });

    return result;
}

function isInsidePath(args: {
    path: string;
    point: [number, number];
    width: number;
    height: number;
    strokeWidth: number;
}) {
    const {path, point, width, height, strokeWidth} = args;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.lineWidth = strokeWidth;
        const path2D = new Path2D(path);
        ctx.stroke(path2D);
        return ctx.isPointInPath(path2D, ...point) || ctx.isPointInStroke(path2D, ...point);
    }

    return null;
}

function getRadius(args: {pointer: [number, number]; center: [number, number]}) {
    const {pointer, center} = args;
    const x = pointer[0] - center[0];
    const y = pointer[1] - center[1];
    const polarRadius = Math.sqrt(x * x + y * y);

    return polarRadius;
}
