import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {
    AreaFormatContext,
    BarXFormatContext,
    BarYFormatContext,
    ChartData,
    PieFormatContext,
} from '../../types';

interface Props {
    seriesType: 'area' | 'bar-x' | 'bar-y' | 'pie';
}

function formatValueWithPercentage({value, percentage}: {value: unknown; percentage?: number}) {
    return `${value} (${Math.round((percentage ?? 0) * 100)}%)`;
}

function getPieData(): ChartData {
    const format = {
        type: 'custom' as const,
        formatter: (context: PieFormatContext) => formatValueWithPercentage(context),
    };
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    dataLabels: {format},
                    tooltip: {valueFormat: format},
                    data: [
                        {name: 'Alpha', label: 'Alpha label', value: 25},
                        {name: 'Beta', label: 'Beta label', value: 75},
                    ],
                },
            ],
        },
    };
}

function getBarXData(): ChartData {
    const format = {
        type: 'custom' as const,
        formatter: (context: BarXFormatContext) => formatValueWithPercentage(context),
    };
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [{x: 'A', y: 25}],
                },
                {
                    type: 'bar-x',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [{x: 'A', y: 75}],
                },
            ],
        },
        xAxis: {type: 'category', categories: ['A']},
    };
}

function getBarYData(): ChartData {
    const format = {
        type: 'custom' as const,
        formatter: (context: BarYFormatContext) => formatValueWithPercentage(context),
    };
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [{x: 25, y: 'A'}],
                },
                {
                    type: 'bar-y',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [{x: 75, y: 'A'}],
                },
            ],
        },
        yAxis: [{type: 'category', categories: ['A']}],
    };
}

function getAreaData(): ChartData {
    const format = {
        type: 'custom' as const,
        formatter: (context: AreaFormatContext) => formatValueWithPercentage(context),
    };
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [
                        {x: 1, y: 25},
                        {x: 2, y: 25},
                    ],
                },
                {
                    type: 'area',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format},
                    tooltip: {valueFormat: format},
                    data: [
                        {x: 1, y: 75},
                        {x: 2, y: 75},
                    ],
                },
            ],
        },
    };
}

const dataBySeriesType: Record<Props['seriesType'], () => ChartData> = {
    area: getAreaData,
    'bar-x': getBarXData,
    'bar-y': getBarYData,
    pie: getPieData,
};

export const PercentageFormatTestStory = ({seriesType}: Props) => {
    return <ChartTestStory data={dataBySeriesType[seriesType]()} />;
};
