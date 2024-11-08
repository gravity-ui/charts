import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import {date} from '@storybook/addon-knobs';
import {range} from 'd3';
import random from 'lodash/random';

import type {ChartData, ScatterSeries, ScatterSeriesData} from '../../../types';

const rowData: ScatterSeriesData<string>[] = [
    {
        y: 86.71905594602345,
        custom: 'green',
    },
    {
        y: 86.73089353359981,
        custom: 'yellow',
    },
    {
        y: 86.53675705168267,
        custom: 'red',
    },
    {
        y: 86.47880981408552,
        custom: 'blue',
    },
    {
        y: 86.4108836764148,
        custom: 'gray',
    },
    {
        y: 86.73440096266042,
        custom: 'pink',
    },
    {
        y: 86.64935929597681,
        custom: 'purple',
    },
];

function prepareData(): ChartData<string> {
    const startDate = date('startDate', new Date(2023, 6, 28, 6)).valueOf();
    const endDate = date('endDate', new Date(2023, 6, 30, 6)).valueOf();
    const step = (endDate - startDate) / rowData.length;
    const dates = range(rowData.length).map((d) => startDate + step * d);

    const scatterData: ScatterSeriesData[] = rowData.map((d, i) => ({
        x: dates[i],
        y: d.y,
        radius: random(3, 6),
        custom: d.custom,
    }));

    const scatterSeries: ScatterSeries = {
        type: 'scatter',
        data: scatterData,
        name: 'some-name',
    };

    return {
        series: {
            data: [scatterSeries],
        },
        xAxis: {
            type: 'datetime',
        },
        yAxis: [
            {
                lineColor: 'transparent',
            },
        ],
        tooltip: {
            renderer: ({hovered}) => {
                const d = hovered[0].data as ScatterSeriesData<string>;
                return <div style={{color: d.custom}}>{dateTime({input: d.x}).format('LL')}</div>;
            },
        },
    };
}

export const scatterTimestampData = prepareData();
