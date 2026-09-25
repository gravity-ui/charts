import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {
        enabled: true,
        position: 'left',
        width: 'auto',
        maxWidth: '30%',
        title: {text: 'Regions'},
    },
    series: {
        data: ['North', 'South', 'West', 'Central region with a long label'].map((name, i) => ({
            type: 'line' as const,
            name,
            data: [
                {x: 0, y: i + 1},
                {x: 1, y: i + 3},
                {x: 2, y: i + 2},
            ],
        })),
    },
};

export function ContentBasedLegendExample() {
    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                minWidth: 200,
                maxWidth: '100%',
                resize: 'horizontal',
                overflow: 'auto',
            }}
        >
            <Chart data={data} />
        </div>
    );
}
