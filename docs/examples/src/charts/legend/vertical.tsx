import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {
        enabled: true,
        position: 'left',
        layout: 'vertical',
        align: 'left',
        verticalAlign: 'top',
        width: 160,
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: [
                    {name: 'Direct', value: 45},
                    {name: 'Search engines', value: 30},
                    {name: 'Social networks', value: 15},
                    {name: 'Email campaigns and referrals', value: 10},
                ],
            },
        ],
    },
};

export function VerticalLegendExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
