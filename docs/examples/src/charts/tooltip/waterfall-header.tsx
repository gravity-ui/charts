import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Revenue',
                data: [
                    {x: Date.UTC(2025, 0, 1), y: 150},
                    {x: Date.UTC(2025, 0, 2), y: -50},
                    {x: Date.UTC(2025, 0, 3), total: true},
                ],
            },
        ],
    },
    xAxis: {
        type: 'datetime',
        timestamps: [Date.UTC(2024, 11, 31), Date.UTC(2025, 0, 4)],
    },
    yAxis: [{type: 'linear', title: {text: 'Revenue'}}],
    legend: {enabled: false},
    defaultState: {hoveredPosition: {x: '20%', y: '50%'}},
};

export function WaterfallHeaderTooltipExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
