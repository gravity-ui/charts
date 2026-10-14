import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

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
                    {name: 'Checkout started', value: 450, label: 'Checkout started: 450'},
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
