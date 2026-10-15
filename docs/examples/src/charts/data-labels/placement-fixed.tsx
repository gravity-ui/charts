import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Sales',
                data: [
                    {x: 0, y: 10},
                    {x: 1, y: 30},
                    {x: 2, y: 20},
                    {x: 3, y: 40},
                ],
                dataLabels: {enabled: true, placement: ['bottom']},
            },
        ],
    },
};

export default function DataLabelsPlacementFixedExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Fixed label placement',
    description: 'Place point labels consistently below the line.',
    docsUrl: 'pages/guides/series-types/line.html#fixed-positions-and-fallback',
    gallery: {
        group: 'data-labels',
    },
} satisfies ExampleMeta;
