import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        options: {'bar-x': {barMaxWidth: 1000}},
        data: [
            {
                type: 'bar-x',
                name: 'Plan',
                barPadding: 0.2,
                grouping: false,
                opacity: 0.6,
                data: [
                    {x: 'Q1', y: 100},
                    {x: 'Q2', y: 80},
                ],
            },
            {
                type: 'bar-x',
                name: 'Actual',
                barPadding: 0.6,
                grouping: false,
                dataLabels: {enabled: true, placement: ['inside-center']},
                data: [
                    {x: 'Q1', y: 75},
                    {x: 'Q2', y: 50},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Q1', 'Q2']},
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
