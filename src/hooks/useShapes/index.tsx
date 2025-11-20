import React from 'react';

import type {Dispatch} from 'd3';
import {group} from 'd3';

import type {
    PreparedAreaSeries,
    PreparedBarXSeries,
    PreparedBarYSeries,
    PreparedHeatmapSeries,
    PreparedLineSeries,
    PreparedPieSeries,
    PreparedRadarSeries,
    PreparedSankeySeries,
    PreparedScatterSeries,
    PreparedSeries,
    PreparedSeriesOptions,
    PreparedSplit,
    PreparedTreemapSeries,
    PreparedWaterfallSeries,
} from '../';
import {ChartError} from '../../libs';
import {getOnlyVisibleSeries} from '../../utils';
import type {PreparedXAxis, PreparedYAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales';

import {AreaSeriesShapes} from './area';
import {prepareAreaData} from './area/prepare-data';
import type {PreparedAreaData} from './area/types';
import {BarXSeriesShapes, prepareBarXData} from './bar-x';
import type {PreparedBarXData} from './bar-x';
import {BarYSeriesShapes, prepareBarYData} from './bar-y';
import type {PreparedBarYData} from './bar-y/types';
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
    | PreparedHeatmapData;

type Args = {
    boundsWidth: number;
    boundsHeight: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    // TODO: https://github.com/gravity-ui/charts/issues/270
    isOutsideBounds: (x: number, y: number) => boolean;
    series: PreparedSeries[];
    seriesOptions: PreparedSeriesOptions;
    split: PreparedSplit;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    dispatcher?: Dispatch<object>;
    // TODO: https://github.com/gravity-ui/charts/issues/270
    shouldUseClipPathIdForScatter?: boolean;
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
};

export const useShapes = (args: Args) => {
    const {
        boundsWidth,
        boundsHeight,
        clipPathId,
        dispatcher,
        htmlLayout,
        isOutsideBounds,
        series,
        seriesOptions,
        shouldUseClipPathIdForScatter,
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
                        case 'bar-x': {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = await prepareBarXData({
                                    series: chartSeries as PreparedBarXSeries[],
                                    seriesOptions,
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    boundsHeight,
                                });
                                shapes.push(
                                    <BarXSeriesShapes
                                        key="bar-x"
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
                        case 'bar-y': {
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
                                        key="bar-y"
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
                        case 'waterfall': {
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
                                        key="waterfall"
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
                        case 'line': {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = await prepareLineData({
                                    series: chartSeries as PreparedLineSeries[],
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    split,
                                    isOutsideBounds,
                                });
                                shapes.push(
                                    <LineSeriesShapes
                                        key="line"
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
                        case 'area': {
                            if (xAxis && xScale && yScale?.length) {
                                const preparedData = await prepareAreaData({
                                    series: chartSeries as PreparedAreaSeries[],
                                    xAxis,
                                    xScale,
                                    yAxis,
                                    yScale,
                                    boundsHeight,
                                    isOutsideBounds,
                                });
                                shapes.push(
                                    <AreaSeriesShapes
                                        key="area"
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
                        case 'scatter': {
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
                                        key="scatter"
                                        clipPathId={
                                            shouldUseClipPathIdForScatter ? clipPathId : undefined
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
                        case 'pie': {
                            const preparedData = await preparePieData({
                                series: chartSeries as PreparedPieSeries[],
                                boundsWidth,
                                boundsHeight,
                            });
                            shapes.push(
                                <PieSeriesShapes
                                    key="pie"
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(...preparedData);
                            break;
                        }
                        case 'treemap': {
                            const preparedData = await prepareTreemapData({
                                // We should have exactly one series with "treemap" type
                                // Otherwise data validation should emit an error
                                series: chartSeries[0] as PreparedTreemapSeries,
                                width: boundsWidth,
                                height: boundsHeight,
                            });
                            shapes.push(
                                <TreemapSeriesShape
                                    key="treemap"
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(preparedData as unknown as ShapeData);
                            break;
                        }
                        case 'sankey': {
                            const preparedData = prepareSankeyData({
                                series: chartSeries[0] as PreparedSankeySeries,
                                width: boundsWidth,
                                height: boundsHeight,
                            });
                            shapes.push(
                                <SankeySeriesShape
                                    key="sankey"
                                    dispatcher={dispatcher}
                                    preparedData={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(preparedData);
                            break;
                        }
                        case 'radar': {
                            const preparedData = await prepareRadarData({
                                series: chartSeries as PreparedRadarSeries[],
                                boundsWidth,
                                boundsHeight,
                            });
                            shapes.push(
                                <RadarSeriesShapes
                                    key="radar"
                                    dispatcher={dispatcher}
                                    series={preparedData}
                                    seriesOptions={seriesOptions}
                                    htmlLayout={htmlLayout}
                                />,
                            );
                            shapesData.push(...preparedData);
                            break;
                        }
                        case 'heatmap': {
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
                                        key="heatmap"
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
        dispatcher,
        htmlLayout,
        series,
        seriesOptions,
        shouldUseClipPathIdForScatter,
        split,
        xAxis,
        xScale,
        yAxis,
        yScale,
        clipPathId,
        isOutsideBounds,
    ]);

    return {shapes: shapesElemens, shapesData: shapesElemensData};
};
