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
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: [
                    {name: 'North', value: 45},
                    {name: 'South', value: 30},
                    {name: 'West', value: 15},
                    {name: 'Central region with a long label', value: 10},
                ],
            },
        ],
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
