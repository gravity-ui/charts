import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const tickValues = Array.from(
    {length: 16},
    (_, index) => Date.UTC(2024, 0, 15) + index * 61 * 24 * 60 * 60 * 1000,
);

const data: ChartData = {
    legend: {enabled: false},
    series: {
        data: [
            {
                type: 'line',
                name: 'Sample',
                data: tickValues.map((x, index) => ({x, y: 1000 + index * 100})),
            },
        ],
    },
    xAxis: {
        type: 'datetime',
        min: tickValues[0],
        max: tickValues[tickValues.length - 1],
        startOnTick: false,
        endOnTick: false,
        ticks: {values: tickValues},
        labels: {
            dateFormat: 'D MMMM',
            rotation: -45,
            style: {fontSize: '11px'},
        },
    },
    yAxis: [{title: {text: 'Value'}}],
};

export function ExplicitAxisLabelsExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
