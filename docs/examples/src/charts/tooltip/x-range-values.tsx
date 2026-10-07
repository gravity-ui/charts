import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {type: 'x-range', name: 'Long', opacity: 0.5, data: [{x0: 0, x1: 10, y: 0}]},
            {type: 'x-range', name: 'Medium', opacity: 0.7, data: [{x0: 2, x1: 9, y: 0}]},
            {type: 'x-range', name: 'Short', data: [{x0: 4, x1: 6, y: 0}]},
        ],
    },
    xAxis: {type: 'linear', min: 0, max: 10, title: {text: 'Time'}},
    yAxis: [{type: 'category', categories: ['Task']}],
    tooltip: {
        sorting: {key: 'value', direction: 'asc'},
        totals: {enabled: true, label: 'Total duration'},
    },
    defaultState: {hoveredPosition: {x: '50%', y: '50%'}},
};

export function XRangeTooltipValuesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
