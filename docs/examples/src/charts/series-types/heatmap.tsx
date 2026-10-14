import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';
import {scaleLinear} from 'd3-scale';

const colors = ['#e6f2ff', '#1769aa'];
const domain = [0, 100];
const colorScale = scaleLinear<string>().domain(domain).range(colors);
const values = [
    [20, 45, 80, 60, 30],
    [35, 70, 95, 75, 40],
    [10, 25, 55, 40, 15],
];

const data: ChartData = {
    series: {
        data: [
            {
                type: 'heatmap',
                name: 'Requests',
                data: values.flatMap((row, y) =>
                    row.map((value, x) => ({x, y, value, color: colorScale(value)})),
                ),
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']},
    yAxis: [{type: 'category', categories: ['Morning', 'Afternoon', 'Evening']}],
    legend: {enabled: true, type: 'continuous', colorScale: {colors, domain, stops: [0, 1]}},
};

export default function HeatmapExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
