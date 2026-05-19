import type {
    PrepareShapeDataArgs,
    PrepareShapeDataResult,
    RenderShapesArgs,
    SeriesPlugin,
} from '~core/series/plugin';
import type {PreparedAreaSeries} from '~core/series/types';
import {getTooltipData} from '~core/shapes/area/get-tooltip-data';
import {prepareAreaData} from '~core/shapes/area/prepare-data';
import {renderArea} from '~core/shapes/area/renderer';
import type {PreparedAreaData} from '~core/shapes/area/types';
import {getTooltipColorSymbol} from '~core/tooltip/utils';
import {filterOverlappingLabels} from '~core/utils';

import type {AreaSeries} from '../../types';

import {prepareAreaSeries} from './prepare-area-series';

export const areaPlugin: SeriesPlugin<AreaSeries> = {
    type: 'area',
    prepareSeries: prepareAreaSeries,
    prepareShapeData: async function (args: PrepareShapeDataArgs): Promise<PrepareShapeDataResult> {
        const {
            series,
            seriesOptions,
            xAxis,
            xScale,
            yAxis,
            yScale,
            split,
            isOutsideBounds,
            isRangeSlider,
        } = args;

        if (!xAxis || !xScale || !yScale?.length || !split) {
            return {renderData: [], tooltipItems: []};
        }

        const data = await prepareAreaData({
            series: series as PreparedAreaSeries[],
            seriesOptions,
            xAxis,
            xScale,
            yAxis: yAxis ?? [],
            yScale,
            split,
            isOutsideBounds: isOutsideBounds ?? (() => false),
            isRangeSlider,
        });

        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        if (!allowOverlap) {
            const filtered = filterOverlappingLabels(data.flatMap((d) => d.htmlLabels));
            const [first, ...rest] = data;
            if (first) {
                const filteredData = [
                    {...first, htmlLabels: filtered},
                    ...rest.map((d) => ({...d, htmlLabels: [] as typeof d.htmlLabels})),
                ];
                return {renderData: filteredData, tooltipItems: filteredData};
            }
        }

        return {renderData: data, tooltipItems: data};
    },
    renderShapes: function ({plot, preparedData, seriesOptions, dispatcher}: RenderShapesArgs) {
        const data = preparedData as PreparedAreaData[];
        const allowOverlap = data.some((d) => d.series.dataLabels.allowOverlap);
        return renderArea({plot}, data, seriesOptions, allowOverlap, dispatcher);
    },
    tooltip: {
        prepareData: getTooltipData,
        row: {
            cells: {
                items: [
                    {
                        id: 'color',
                        source: 'color',
                        format: {
                            type: 'custom',
                            formatter: ({value}) => {
                                return value ? getTooltipColorSymbol(String(value)) : '';
                            },
                        },
                    },
                    {id: 'name', source: 'name', align: 'start'},
                    {id: 'value', source: 'data.y', align: 'end'},
                ],
            },
        },
    },
};
