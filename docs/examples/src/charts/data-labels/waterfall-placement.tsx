import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Balance',
                data: [
                    {x: 0, y: 80},
                    {x: 1, y: -110},
                    {x: 2, total: true},
                ],
                dataLabels: {placement: 'auto', placementFallback: 'hide'},
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Opening', 'Refunds', 'Closing']},
    yAxis: [{min: -30, max: 100}],
    legend: {enabled: false},
};

export default function WaterfallLabelPlacementExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Waterfall',
    title: 'Adaptive waterfall labels',
    description: 'Move labels inside columns near the plot edge.',
    docsUrl: 'pages/guides/series-types/waterfall.html#data-label-placement',
    gallery: {group: 'data-labels'},
} satisfies ExampleMeta;
