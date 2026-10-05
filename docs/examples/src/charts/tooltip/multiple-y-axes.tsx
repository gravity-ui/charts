import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    xAxis: {type: 'category', categories: ['Mon', 'Tue', 'Wed']},
    yAxis: [
        {type: 'linear', title: {text: 'Count'}},
        {type: 'category', categories: ['1x', '2x', '3x'], position: 'right'},
    ],
    series: {
        data: [
            {
                type: 'line',
                name: 'Small count',
                data: [
                    {x: 0, y: 2},
                    {x: 1, y: 3},
                    {x: 2, y: 4},
                ],
            },
            {
                type: 'line',
                name: 'Large count',
                data: [
                    {x: 0, y: 10},
                    {x: 1, y: 12},
                    {x: 2, y: 15},
                ],
            },
            {
                type: 'line',
                name: 'Tier',
                yAxis: 1,
                data: [
                    {x: 0, y: 0},
                    {x: 1, y: 1},
                    {x: 2, y: 2},
                ],
            },
        ],
    },
    tooltip: {
        sorting: {key: 'value'},
        renderer: ({hovered, yAxes}) => (
            <div style={{padding: 12}}>
                {hovered.map((item, index) => {
                    const axisIndex = 'yAxis' in item.series ? (item.series.yAxis ?? 0) : 0;
                    const axis = yAxes?.[axisIndex] ?? yAxes?.[0];
                    const value = 'y' in item.data ? item.data.y : undefined;
                    const label =
                        axis?.type === 'category' && typeof value === 'number'
                            ? axis.categories?.[value]
                            : value;
                    return (
                        <div key={index}>
                            {item.series.name}: {String(label ?? '')}
                        </div>
                    );
                })}
            </div>
        ),
    },
};

export function MultipleYAxisTooltipExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
