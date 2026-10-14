import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'funnel',
                name: 'Checkout',
                dataLabels: {inside: true},
                data: [
                    {name: 'Product viewed', value: 1200, label: 'Product viewed: 1200'},
                    {name: 'Added to cart', value: 720, label: 'Added to cart: 720'},
                    {name: 'Checkout started', value: 450, label: 'Checkout: 450'},
                    {name: 'Purchased', value: 360, label: 'Purchased: 360'},
                ],
            },
        ],
    },
    legend: {enabled: false},
};

export default function FunnelExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Funnel',
    title: 'Basic funnel chart',
    description: 'Basic funnel configuration with labels inside segments.',
    docsUrl: 'pages/guides/series-types/funnel.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
