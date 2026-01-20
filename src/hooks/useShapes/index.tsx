import React from 'react';

import type {Dispatch} from 'd3';
import {group} from 'd3';

import {SERIES_TYPE} from '../../constants';
import type {SeriesType} from '../../constants';
import {ChartError} from '../../libs';
import {getOnlyVisibleSeries} from '../../utils';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales';
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
} from '../useSeries/types';
import type {PreparedSplit} from '../useSplit/types';

import {AreaSeriesShapes} from './area';
import {prepareAreaData} from './area/prepare-data';
import type {PreparedAreaData} from './area/types';
import {BarXSeriesShapes, prepareBarXData} from './bar-x';
import type {PreparedBarXData} from './bar-x';
import {BarYSeriesShapes, prepareBarYData} from './bar-y';
import type {PreparedBarYData} from './bar-y/types';
import type {PreparedFunnelData} from './funnel';
import {FunnelSeriesShapes, prepareFunnelData} from './funnel';
import type {PreparedHeatmapData} from './heatmap';
import {HeatmapSeriesShapes, prepareHeatmapData} from './heatmap';
import {LineSeriesShapes} from './line';
import {prepareLineData} from './line/prepare-data';
import type {PreparedLineData} from './line/types';
import {PieSeriesShapes} from './pie';
import {preparePieData} from './pie/prepare-data';
import type {PreparedPieData} from './pie/types';
import {RadarSeriesShapes} from './radar';
import {prepareRadarData} from './radar/prepare-data';
import type {PreparedRadarData} from './radar/types';
import {SankeySeriesShape} from './sankey';
import {prepareSankeyData} from './sankey/prepare-data';
import type {PreparedSankeyData} from './sankey/types';
import {ScatterSeriesShape, prepareScatterData} from './scatter';
import type {PreparedScatterData} from './scatter/types';
export type {PreparedBarXData} from './bar-x';
export type {PreparedScatterData} from './scatter/types';
import {TreemapSeriesShape} from './treemap';
import {prepareTreemapData} from './treemap/prepare-data';
import type {PreparedWaterfallData} from './waterfall';
import {WaterfallSeriesShapes, prepareWaterfallData} from './waterfall';

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
    | PreparedFunnelData;

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
};

function IS_OUTSIDE_BOUNDS() {
    return false;
}

function shouldUseClipPathId(seriesType: SeriesType, clipPathBySeriesType?: ClipPathBySeriesType) {
    return clipPathBySeriesType?.[seriesType] ?? true;
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
    } = args;

    const [shapesElemens, setShapesElements] = React.useState<React.ReactElement[]>([]);
    const [shapesElemensData, setShapesElemensData] = React.useState<ShapeData[]>([]);

    const countedRef = React.useRef(0);

    React.useEffect(() => {
        countedRef.current++;

        (async () => {
            const currentRun = countedRef.current;

            const visibleSeries = getOnlyVisibleSeries(series);
            const groupedSeries = group(visibleSeries, (item) => item.type);
            const shapesData: ShapeData[] = [];
            const shapes: React.ReactElement[] = [];

            await Promise.all(
                // eslint-disable-next-line complexity
                Array.from(groupedSeries).map(async (item) => {
                    const [seriesType, chartSeries] = item;
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
                                shapes.push(
                                    <BarXSeriesShapes
                                        key={SERIES_TYPE.BarX}
                                        dispatcher={dispatcher}
                                        seriesOptions={seriesOptions}
                                        preparedData={preparedData}
                                        htmlLayout={htmlLayout}
                                        clipPathId={clipPathId}
                                    />,
                                );
                                shapesData.push(...preparedData);
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
                                shapes.push(
                                    <BarYSeriesShapes
                                        key={SERIES_TYPE.BarY}
                                        dispatcher={dispatcher}
                                        seriesOptions={seriesOptions}
                                        preparedData={preparedData}
                                        htmlLayout={htmlLayout}
                                        clipPathId={clipPathId}
                                    />,
                                );
                                shapesData.push(...preparedData.shapes);
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
                                shapes.push(
                                    <WaterfallSeriesShapes
                                        key={SERIES_TYPE.Waterfall}
                                        dispatcher={dispatcher}
                                        seriesOptions={seriesOptions}
                                        preparedData={preparedData}
                                        htmlLayout={htmlLayout}
                                        clipPathId={clipPathId}
                                    />,
                                );
                                shapesData.push(...preparedData);
                            }
                            break;
                        }
                        case SERIES_TYPE.Line: {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = await prepareLineData({
                                    series: chartSeries as PreparedLineSeries[],
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    split,
                                    isOutsideBounds,
                                    isRangeSlider,
                                });
                                shapes.push(
                                    <LineSeriesShapes
                                        key={SERIES_TYPE.Line}
                                        dispatcher={dispatcher}
                                        seriesOptions={seriesOptions}
                                        preparedData={preparedData}
                                        htmlLayout={htmlLayout}
                                        clipPathId={clipPathId}
                                    />,
                                );
                                shapesData.push(...preparedData);
                            }
                            break;
                        }
                        case SERIES_TYPE.Area: {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = await prepareAreaData({
                                    series: chartSeries as PreparedAreaSeries[],
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    boundsHeight,
                                    split,
                                    isOutsideBounds,
                                    isRangeSlider,
                                });
                                shapes.push(
                                    <AreaSeriesShapes
                                        key={SERIES_TYPE.Area}
                                        dispatcher={dispatcher}
                                        seriesOptions={seriesOptions}
                                        preparedData={preparedData}
                                        htmlLayout={htmlLayout}
                                        clipPathId={clipPathId}
                                    />,
                                );
                                shapesData.push(...preparedData);
                            }
                            break;
                        }
                        case SERIES_TYPE.Scatter: {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = prepareScatterData({
                                    series: chartSeries as PreparedScatterSeries[],
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    isOutsideBounds,
                                });
                                shapes.push(
                                    <ScatterSeriesShape
                                        key={SERIES_TYPE.Scatter}
                                        clipPathId={
                                            shouldUseClipPathId(
                                                SERIES_TYPE.Scatter,
                                                clipPathBySeriesType,
                                            )
                                                ? clipPathId
                                                : undefined
                                        }
                                        dispatcher={dispatcher}
                                        preparedData={preparedData}
                                        seriesOptions={seriesOptions}
                                        htmlLayout={htmlLayout}
                                    />,
                                );
                                shapesData.push(...preparedData);
                            }
                            break;
                        }
                        case SERIES_TYPE.Pie: {
                            const preparedData = await preparePieData({
                                series: chartSeries as PreparedPieSeries[],
                                boundsWidth,
                                boundsHeight,
                            });
                            shapes.push(
                                <PieSeriesShapes
                                    key={SERIES_TYPE.Pie}
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(...preparedData);
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
                            shapes.push(
                                <TreemapSeriesShape
                                    key={SERIES_TYPE.Treemap}
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(preparedData as unknown as ShapeData);
                            break;
                        }
                        case SERIES_TYPE.Sankey: {
                            const preparedData = prepareSankeyData({
                                series: chartSeries[0] as PreparedSankeySeries,
                                width: boundsWidth,
                                height: boundsHeight,
                            });
                            shapes.push(
                                <SankeySeriesShape
                                    key={SERIES_TYPE.Sankey}
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(preparedData);
                            break;
                        }
                        case SERIES_TYPE.Radar: {
                            const preparedData = await prepareRadarData({
                                series: chartSeries as PreparedRadarSeries[],
                                boundsWidth,
                                boundsHeight,
                            });
                            shapes.push(
                                <RadarSeriesShapes
                                    key={SERIES_TYPE.Radar}
                                    dispatcher={dispatcher}
                                    series={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(...preparedData);
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
                                shapes.push(
                                    <HeatmapSeriesShapes
                                        key={SERIES_TYPE.Heatmap}
                                        dispatcher={dispatcher}
                                        preparedData={preparedData}
                                        seriesOptions={seriesOptions}
                                        htmlLayout={htmlLayout}
                                    />,
                                );
                                shapesData.push(preparedData);
                            }
                            break;
                        }
                        case 'funnel': {
                            const preparedData = await prepareFunnelData({
                                series: chartSeries as PreparedFunnelSeries[],
                                boundsWidth,
                                boundsHeight,
                            });
                            shapes.push(
                                <FunnelSeriesShapes
                                    key="funnel"
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(preparedData);
                            break;
                        }
                        default: {
                            throw new ChartError({
                                message: `The display method is not defined for a series with type "${seriesType}"`,
                            });
                        }
                    }
                }),
            );

            if (countedRef.current === currentRun) {
                setShapesElements(shapes);
                setShapesElemensData(shapesData);
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
    ]);

    return {shapes: shapesElemens, shapesData: shapesElemensData};
};
