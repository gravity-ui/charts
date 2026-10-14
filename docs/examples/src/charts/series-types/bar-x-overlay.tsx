import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Plan',
                grouping: false,
                opacity: 0.6,
                data: [
                    {x: 'A', y: 100},
                    {x: 'B', y: 80},
                ],
            },
            {
                type: 'bar-x',
                name: 'Actual',
                grouping: false,
                opacity: 0.6,
                dataLabels: {enabled: true, inside: true},
                data: [
                    {x: 'A', y: 75},
                    {x: 'B', y: 50},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['A', 'B']},
};

export default function BarXOverlayExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Overlapping columns',
    description: 'Compare columns with grouping disabled and partial opacity.',
    docsUrl: 'pages/guides/series-types/bar-x.html#grouping-and-stacking',
} satisfies ExampleMeta;
