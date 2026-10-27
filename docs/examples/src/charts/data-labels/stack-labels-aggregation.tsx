import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    xAxis: {type: 'category', categories: ['Apples', 'Oranges']},
    yAxis: [{title: {text: 'Revenue'}, max: 650}],
    series: {
        options: {
            'bar-x': {
                stackLabels: {
                    enabled: true,
                    aggregation: ({points}) =>
                        points.reduce((sum, point) => sum + (point.custom?.orders ?? 0), 0),
                    format: {type: 'number', postfix: ' orders'},
                },
            },
        },
        data: [
            {
                type: 'bar-x',
                name: 'Store A',
                stacking: 'normal',
                dataLabels: {enabled: true, inside: true},
                data: [
                    {x: 'Apples', y: 300, label: '12 orders', custom: {orders: 12}},
                    {x: 'Oranges', y: 200, label: '10 orders', custom: {orders: 10}},
                ],
            },
            {
                type: 'bar-x',
                name: 'Store B',
                stacking: 'normal',
                dataLabels: {enabled: true, inside: true},
                data: [
                    {x: 'Apples', y: 200, label: '8 orders', custom: {orders: 8}},
                    {x: 'Oranges', y: 150, label: '6 orders', custom: {orders: 6}},
                ],
            },
        ],
    },
};

export default function StackLabelsAggregationExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Custom stack totals',
    description: 'Show order totals independently of revenue and segment labels.',
    docsUrl: 'pages/guides/data-labels.html#custom-stack-totals',
    gallery: {group: 'data-labels'},
} satisfies ExampleMeta;
