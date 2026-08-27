import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

interface Props {
    seriesType: 'area' | 'area-sparse' | 'bar-x' | 'bar-y' | 'pie';
}

function formatValueWithPercentage({value, percentage}: {value: unknown; percentage?: number}) {
    return `${value} (${Math.round((percentage ?? 0) * 100)}%)`;
}

const percentageFormat = {
    type: 'custom' as const,
    formatter: formatValueWithPercentage,
};

function getPieData(): ChartData {
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    dataLabels: {format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
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
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [{x: 'A', y: 25}],
                },
                {
                    type: 'bar-x',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [{x: 'A', y: 75}],
                },
            ],
        },
        xAxis: {type: 'category', categories: ['A']},
    };
}

function getBarYData(): ChartData {
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [{x: 25, y: 'A'}],
                },
                {
                    type: 'bar-y',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [{x: 75, y: 'A'}],
                },
            ],
        },
        yAxis: [{type: 'category', categories: ['A']}],
    };
}

function getAreaData(): ChartData {
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [
                        {x: 1, y: 25},
                        {x: 2, y: 25},
                    ],
                },
                {
                    type: 'area',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [
                        {x: 1, y: 75},
                        {x: 2, y: 75},
                    ],
                },
            ],
        },
    };
}

function getSparseAreaData(): ChartData {
    return {
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'First',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [
                        {x: 1, y: 10},
                        {x: 2, y: 10},
                        {x: 3, y: 10},
                    ],
                },
                {
                    type: 'area',
                    name: 'Second',
                    stacking: 'percent',
                    dataLabels: {enabled: true, allowOverlap: true, format: percentageFormat},
                    tooltip: {valueFormat: percentageFormat},
                    data: [{x: 2, y: 10}],
                },
            ],
        },
    };
}

const dataBySeriesType: Record<Props['seriesType'], () => ChartData> = {
    area: getAreaData,
    'area-sparse': getSparseAreaData,
    'bar-x': getBarXData,
    'bar-y': getBarYData,
    pie: getPieData,
};

export const PercentageFormatTestStory = ({seriesType}: Props) => {
    return <ChartTestStory data={dataBySeriesType[seriesType]()} />;
};
