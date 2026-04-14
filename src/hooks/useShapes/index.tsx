import React from 'react';

import {group} from 'd3-array';
import type {Dispatch} from 'd3-dispatch';

import {SERIES_TYPE} from '~core/constants';
import type {SeriesType} from '~core/constants';
import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import type {
    PreparedAreaSeries,
    PreparedBarXSeries,
    PreparedBarYSeries,
    PreparedFunnelSeries,
    PreparedHeatmapSeries,
    PreparedLineSeries,
    PreparedPieSeries,
    PreparedRadarSeries,
    PreparedSankeySeries,
    PreparedScatterSeries,
    PreparedSeries,
    PreparedSeriesOptions,
    PreparedTreemapSeries,
    PreparedWaterfallSeries,
    PreparedXRangeSeries,
} from '~core/series/types';
import {prepareAreaData} from '~core/shapes/area/prepare-data';
import type {PreparedAreaData} from '~core/shapes/area/types';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import type {PreparedBarYData} from '~core/shapes/bar-y/types';
import type {PreparedFunnelData} from '~core/shapes/funnel/types';
import type {PreparedHeatmapData} from '~core/shapes/heatmap/types';
import {prepareLineData} from '~core/shapes/line/prepare-data';
import type {PreparedLineData} from '~core/shapes/line/types';
import {preparePieData} from '~core/shapes/pie/prepare-data';
import type {PreparedPieData} from '~core/shapes/pie/types';
import {prepareRadarData} from '~core/shapes/radar/prepare-data';
import type {PreparedRadarData} from '~core/shapes/radar/types';
import {prepareSankeyData} from '~core/shapes/sankey/prepare-data';
import type {PreparedSankeyData} from '~core/shapes/sankey/types';
import type {PreparedScatterData} from '~core/shapes/scatter/types';
import {prepareTreemapData} from '~core/shapes/treemap/prepare-data';
import type {PreparedWaterfallData} from '~core/shapes/waterfall/types';
import type {PreparedXRangeData} from '~core/shapes/x-range/types';
import {getOnlyVisibleSeries} from '~core/utils';
import type {ZoomState} from '~core/zoom/types';

import {ChartError} from '../../libs';
import type {ShapeDataWithLabels} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';

import {AreaSeriesShapes} from './area';
import {BarXSeriesShapes, prepareBarXData} from './bar-x';
import {BarYSeriesShapes, prepareBarYData} from './bar-y';
import {FunnelSeriesShapes, prepareFunnelData} from './funnel';
import {HeatmapSeriesShapes, prepareHeatmapData} from './heatmap';
import {LineSeriesShapes} from './line';
import {PieSeriesShapes} from './pie';
import {RadarSeriesShapes} from './radar';
import {SankeySeriesShape} from './sankey';
import {ScatterSeriesShape, prepareScatterData} from './scatter';
import {TreemapSeriesShape} from './treemap';
import {getSeriesClipPathId} from './utils';
import {WaterfallSeriesShapes, prepareWaterfallData} from './waterfall';
import {XRangeSeriesShapes, prepareXRangeData} from './x-range';

import './styles.scss';

export type ShapeData =
    | PreparedBarXData
    | PreparedBarYData
    | PreparedScatterData
    | PreparedLineData
    | PreparedPieData
    | PreparedAreaData
    | PreparedWaterfallData
    | PreparedSankeyData
    | PreparedRadarData
    | PreparedHeatmapData
    | PreparedFunnelData
    | PreparedXRangeData;

export type ClipPathBySeriesType = Partial<Record<SeriesType, boolean>>;

type Args = {
    boundsWidth: number;
    boundsHeight: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    series: PreparedSeries[];
    seriesOptions: PreparedSeriesOptions;
    split: PreparedSplit;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    clipPathBySeriesType?: ClipPathBySeriesType;
    dispatcher?: Dispatch<object>;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    zoomState?: Partial<ZoomState>;
};

function IS_OUTSIDE_BOUNDS() {
    return false;
}

function shouldUseClipPathId(seriesType: SeriesType, clipPathBySeriesType?: ClipPathBySeriesType) {
    return clipPathBySeriesType?.[seriesType] ?? true;
}

export async function getShapes(args: Args) {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        clipPathBySeriesType,
        dispatcher,
        htmlLayout,
        isOutsideBounds = IS_OUTSIDE_BOUNDS,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
    } = args;

    const visibleSeries = getOnlyVisibleSeries(series);
    const groupedSeries = group(visibleSeries, (item) => {
        if (item.type === 'line') {
            return item.id;
        }

        return item.type;
    });
    const shapesData: ShapeData[] = [];
    const shapes: React.ReactElement[] = [];
    const layers: ShapeDataWithLabels[] = [];

    const groupedSeriesItems = Array.from(groupedSeries);
    for (let index = groupedSeriesItems.length - 1; index >= 0; index--) {
        const item = groupedSeriesItems[index];

        const [groupId, chartSeries] = item;
        const seriesType = chartSeries[0].type;
        switch (seriesType) {
            case SERIES_TYPE.BarX: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareBarXData({
                        series: chartSeries as PreparedBarXSeries[],
                        seriesOptions,
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                        boundsHeight,
                        split,
                        isRangeSlider,
                    });
                    shapes[index] = (
                        <BarXSeriesShapes
                            key={SERIES_TYPE.BarX}
                            boundsHeight={boundsHeight}
                            boundsWidth={boundsWidth}
                            dispatcher={dispatcher}
                            seriesOptions={seriesOptions}
                            preparedData={preparedData}
                            htmlLayout={htmlLayout}
                            clipPathId={clipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData);
                    layers.push(...preparedData);
                }
                break;
            }
            case SERIES_TYPE.BarY: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareBarYData({
                        boundsHeight,
                        boundsWidth,
                        series: chartSeries as PreparedBarYSeries[],
                        seriesOptions,
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                    });
                    shapes[index] = (
                        <BarYSeriesShapes
                            key={SERIES_TYPE.BarY}
                            dispatcher={dispatcher}
                            seriesOptions={seriesOptions}
                            preparedData={preparedData}
                            htmlLayout={htmlLayout}
                            clipPathId={clipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData.shapes);
                }
                break;
            }
            case SERIES_TYPE.Waterfall: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareWaterfallData({
                        series: chartSeries as PreparedWaterfallSeries[],
                        seriesOptions,
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                    });
                    shapes[index] = (
                        <WaterfallSeriesShapes
                            key={SERIES_TYPE.Waterfall}
                            dispatcher={dispatcher}
                            seriesOptions={seriesOptions}
                            preparedData={preparedData}
                            htmlLayout={htmlLayout}
                            clipPathId={clipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData);
                }
                break;
            }
            case SERIES_TYPE.Line: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareLineData({
                        series: chartSeries as PreparedLineSeries[],
                        seriesOptions,
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                        split,
                        isOutsideBounds,
                        isRangeSlider,
                        otherLayers: layers,
                    });
                    const resultClipPathId = getSeriesClipPathId({
                        clipPathId,
                        yAxis,
                        zoomState,
                    });
                    shapes[index] = (
                        <LineSeriesShapes
                            key={groupId}
                            boundsHeight={boundsHeight}
                            boundsWidth={boundsWidth}
                            dispatcher={dispatcher}
                            seriesOptions={seriesOptions}
                            preparedData={preparedData}
                            htmlLayout={htmlLayout}
                            clipPathId={resultClipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData);
                    layers.push(...preparedData);
                }
                break;
            }
            case SERIES_TYPE.Area: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareAreaData({
                        series: chartSeries as PreparedAreaSeries[],
                        seriesOptions,
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                        split,
                        isOutsideBounds,
                        isRangeSlider,
                    });
                    shapes[index] = (
                        <AreaSeriesShapes
                            key={SERIES_TYPE.Area}
                            boundsHeight={boundsHeight}
                            boundsWidth={boundsWidth}
                            dispatcher={dispatcher}
                            seriesOptions={seriesOptions}
                            preparedData={preparedData}
                            htmlLayout={htmlLayout}
                            clipPathId={clipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData);
                    layers.push(...preparedData);
                }
                break;
            }
            case SERIES_TYPE.Scatter: {
                if (xAxis && xScale && yScale?.length) {
                    const scatterShapeData = await prepareScatterData({
                        series: chartSeries as PreparedScatterSeries[],
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                        split,
                        isOutsideBounds,
                        isRangeSlider,
                    });
                    shapes[index] = (
                        <ScatterSeriesShape
                            key={SERIES_TYPE.Scatter}
                            clipPathId={
                                shouldUseClipPathId(SERIES_TYPE.Scatter, clipPathBySeriesType)
                                    ? clipPathId
                                    : undefined
                            }
                            dispatcher={dispatcher}
                            preparedData={scatterShapeData}
                            seriesOptions={seriesOptions}
                            htmlLayout={htmlLayout}
                        />
                    );
                    shapesData.splice(index, 0, ...scatterShapeData.markers);
                }
                break;
            }
            case SERIES_TYPE.Pie: {
                const preparedData = await preparePieData({
                    series: chartSeries as PreparedPieSeries[],
                    boundsWidth,
                    boundsHeight,
                });
                shapes[index] = (
                    <PieSeriesShapes
                        key={SERIES_TYPE.Pie}
                        dispatcher={dispatcher}
                        preparedData={preparedData}
                        seriesOptions={seriesOptions}
                        htmlLayout={htmlLayout}
                    />
                );
                shapesData.splice(index, 0, ...preparedData);
                break;
            }
            case SERIES_TYPE.Treemap: {
                const preparedData = await prepareTreemapData({
                    // We should have exactly one series with "treemap" type
                    // Otherwise data validation should emit an error
                    series: chartSeries[0] as PreparedTreemapSeries,
                    width: boundsWidth,
                    height: boundsHeight,
                });
                shapes[index] = (
                    <TreemapSeriesShape
                        key={SERIES_TYPE.Treemap}
                        dispatcher={dispatcher}
                        preparedData={preparedData}
                        seriesOptions={seriesOptions}
                        htmlLayout={htmlLayout}
                    />
                );
                shapesData.splice(index, 0, preparedData as unknown as ShapeData);
                break;
            }
            case SERIES_TYPE.Sankey: {
                const preparedData = prepareSankeyData({
                    series: chartSeries[0] as PreparedSankeySeries,
                    width: boundsWidth,
                    height: boundsHeight,
                });
                shapes[index] = (
                    <SankeySeriesShape
                        key={SERIES_TYPE.Sankey}
                        dispatcher={dispatcher}
                        preparedData={preparedData}
                        seriesOptions={seriesOptions}
                        htmlLayout={htmlLayout}
                    />
                );
                shapesData.splice(index, 0, preparedData);
                break;
            }
            case SERIES_TYPE.Radar: {
                const preparedData = await prepareRadarData({
                    series: chartSeries as PreparedRadarSeries[],
                    boundsWidth,
                    boundsHeight,
                });
                shapes[index] = (
                    <RadarSeriesShapes
                        key={SERIES_TYPE.Radar}
                        dispatcher={dispatcher}
                        series={preparedData}
                        seriesOptions={seriesOptions}
                        htmlLayout={htmlLayout}
                    />
                );
                shapesData.splice(index, 0, ...preparedData);
                break;
            }
            case SERIES_TYPE.Heatmap: {
                if (xAxis && xScale && yScale?.[0]) {
                    const preparedData = await prepareHeatmapData({
                        series: chartSeries[0] as PreparedHeatmapSeries,
                        xAxis,
                        xScale,
                        yAxis: yAxis[0],
                        yScale: yScale[0],
                    });
                    shapes[index] = (
                        <HeatmapSeriesShapes
                            key={SERIES_TYPE.Heatmap}
                            dispatcher={dispatcher}
                            preparedData={preparedData}
                            seriesOptions={seriesOptions}
                            htmlLayout={htmlLayout}
                        />
                    );
                    shapesData.splice(index, 0, preparedData);
                }
                break;
            }
            case SERIES_TYPE.Funnel: {
                const preparedData = await prepareFunnelData({
                    series: chartSeries as PreparedFunnelSeries[],
                    boundsWidth,
                    boundsHeight,
                });
                shapes[index] = (
                    <FunnelSeriesShapes
                        key={SERIES_TYPE.Funnel}
                        dispatcher={dispatcher}
                        preparedData={preparedData}
                        seriesOptions={seriesOptions}
                        htmlLayout={htmlLayout}
                    />
                );
                shapesData.splice(index, 0, preparedData);
                break;
            }
            case SERIES_TYPE.XRange: {
                if (xAxis && xScale && yScale?.length) {
                    const preparedData = await prepareXRangeData({
                        series: chartSeries as PreparedXRangeSeries[],
                        xAxis,
                        xScale,
                        yAxis,
                        yScale,
                        boundsWidth,
                        isRangeSlider,
                    });
                    shapes[index] = (
                        <XRangeSeriesShapes
                            key={SERIES_TYPE.XRange}
                            dispatcher={dispatcher}
                            preparedData={preparedData}
                            seriesOptions={seriesOptions}
                            htmlLayout={htmlLayout}
                            clipPathId={clipPathId}
                        />
                    );
                    shapesData.splice(index, 0, ...preparedData);
                }
                break;
            }
            default: {
                throw new ChartError({
                    message: `The display method is not defined for a series with type "${seriesType}"`,
                });
            }
        }
    }

    return {shapes, shapesData};
}

export const useShapes = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        clipPathBySeriesType,
        dispatcher,
        htmlLayout,
        isOutsideBounds = IS_OUTSIDE_BOUNDS,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
    } = args;

    const [shapesElements, setShapesElements] = React.useState<React.ReactElement[]>([]);
    const [shapesElementsData, setShapesElementsData] = React.useState<ShapeData[]>([]);
    const shapesReadyRef = React.useRef(false);

    const countedRef = React.useRef(0);

    React.useEffect(() => {
        countedRef.current++;

        if (!boundsHeight || !boundsWidth) {
            return;
        }

        (async () => {
            const currentRun = countedRef.current;

            const {shapes, shapesData} = await getShapes({
                boundsHeight,
                boundsWidth,
                clipPathId,
                clipPathBySeriesType,
                dispatcher,
                htmlLayout,
                isOutsideBounds,
                isRangeSlider,
                series,
                seriesOptions,
                split,
                xAxis,
                xScale,
                yAxis,
                yScale,
                zoomState,
            });

            if (countedRef.current === currentRun) {
                shapesReadyRef.current = true;
                setShapesElements(shapes);
                setShapesElementsData(shapesData);
            }
        })();
    }, [
        boundsHeight,
        boundsWidth,
        clipPathId,
        clipPathBySeriesType,
        dispatcher,
        htmlLayout,
        isOutsideBounds,
        isRangeSlider,
        series,
        seriesOptions,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        zoomState,
    ]);

    return {
        shapes: shapesElements,
        shapesData: shapesElementsData,
        shapesReady: shapesReadyRef.current,
    };
};
