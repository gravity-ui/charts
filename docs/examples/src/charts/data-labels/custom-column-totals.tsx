import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    xAxis: {type: 'category', categories: ['January']},
    yAxis: [{min: 0, max: 450}],
    series: {
        data: [
            {name: 'Desktop', revenue: 100, orders: 3},
            {name: 'Mobile', revenue: 200, orders: 7},
        ].map(({name, revenue, orders}) => ({
            type: 'bar-x',
            name,
            stacking: 'normal',
            dataLabels: {enabled: true, inside: true},
            data: [{x: 0, y: revenue, label: orders, stackLabelValue: orders}],
        })),
        options: {
            'bar-x': {
                stackLabels: {
                    enabled: true,
                    valueSource: 'custom',
                    allowOverlap: true,
                    format: {type: 'number', precision: 0, postfix: ' orders'},
                },
            },
        },
    },
};

export default function CustomTotalsExample() {
    return <Chart data={data} />;
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Order totals on revenue bars',
    description: 'Show a separate order measure at the revenue stack boundary.',
    docsUrl: 'pages/guides/data-labels.html#totals-from-a-separate-measure',
    gallery: {group: 'data-labels'},
} satisfies ExampleMeta;
