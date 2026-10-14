import {scaleBand, scaleLinear} from 'd3-scale';

import {getPreparedXAxis} from '../../core/axes/x-axis';
import {getPreparedYAxis} from '../../core/axes/y-axis';
import {getPreparedLegend} from '../../core/series/prepare-legend';
import {getPreparedOptions} from '../../core/series/prepare-options';
import {getPreparedSeries} from '../../core/series/prepareSeries';
import {getShapes} from '../../hooks/useShapes';
import type {ChartSeries} from '../../types';

export async function prepareTooltipContext(seriesData: ChartSeries[], categories?: string[]) {
    const boundsWidth = 300;
    const boundsHeight = 300;
    const preparedLegend = await getPreparedLegend({
        legend: {enabled: false},
        series: seriesData,
        chartWidth: boundsWidth,
        chartMargin: {left: 0, right: 0, top: 0, bottom: 0},
    });
    const series = await getPreparedSeries({
        seriesData,
        seriesOptions: undefined,
        colors: ['#000'],
        preparedLegend,
    });
    const xAxis = await getPreparedXAxis({
        xAxis: categories
            ? {type: 'category', categories, visible: false}
            : {type: 'linear', visible: false, min: 0, max: boundsWidth},
        seriesData,
        width: boundsWidth,
        boundsWidth,
    });
    const yAxis = await getPreparedYAxis({
        yAxis: [{type: 'linear', visible: false, min: 0, max: boundsHeight}],
        seriesData,
        width: boundsWidth,
        height: boundsHeight,
        boundsHeight,
    });
    if (!xAxis) {
        throw new Error('An axis-related series is required');
    }
    return {
        boundsWidth,
        boundsHeight,
        xAxis,
        yAxis,
        xScale: categories
            ? scaleBand().domain(categories).range([0, boundsWidth])
            : scaleLinear().domain([0, boundsWidth]).range([0, boundsWidth]),
        yScale: [scaleLinear().domain([0, boundsHeight]).range([0, boundsHeight])],
        series,
        seriesOptions: getPreparedOptions(),
        split: {
            gap: 0,
            plots: [{top: 0, height: boundsHeight, title: {x: 0, y: 0, text: '', height: 0}}],
        },
        clipPathId: 'tooltip-fixture',
        htmlLayout: null,
        isOutsideBounds: () => false,
    };
}

export async function prepareTooltipShapes(seriesData: ChartSeries[], categories?: string[]) {
    return getShapes(await prepareTooltipContext(seriesData, categories));
}
