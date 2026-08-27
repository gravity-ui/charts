import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const DATA = [
    {x: 0, y: 10},
    {x: 1, y: 60},
    {x: 2, y: 20},
    {x: 3, y: 80},
    {x: 4, y: 30},
    {x: 5, y: 70},
    {x: 6, y: 40},
];

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Cardinal (tension 0)',
                data: DATA,
                lineWidth: 2,
                marker: {enabled: true},
                interpolation: {type: 'cardinal', tension: 0},
            },
            {
                type: 'line',
                name: 'Cardinal (tension 0.5)',
                data: DATA,
                lineWidth: 2,
                marker: {enabled: true},
                interpolation: {type: 'cardinal', tension: 0.5},
            },
            {
                type: 'line',
                name: 'Cardinal (tension 1)',
                data: DATA,
                lineWidth: 2,
                marker: {enabled: true},
                interpolation: {type: 'cardinal', tension: 1},
            },
        ],
    },
    xAxis: {type: 'linear'},
};

export function LineInterpolationCardinalExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
