import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    legend: {enabled: false},
    xAxis: {
        type: 'datetime',
        min: Date.UTC(2026, 0, 1),
        max: Date.UTC(2026, 2, 1),
        startOnTick: false,
        endOnTick: false,
        maxPadding: 0,
        labels: {
            dateFormat: 'DD',
            additionalLevels: [
                {
                    format: {type: 'date', format: 'MMMM'},
                    ranges: [0, 1].map((month) => ({
                        from: Date.UTC(2026, month, 1),
                        to: Date.UTC(2026, month + 1, 1),
                        value: Date.UTC(2026, month, 1),
                    })),
                },
                {ranges: [{from: Date.UTC(2026, 0, 1), to: Date.UTC(2027, 0, 1), value: 2026}]},
            ],
        },
    },
    series: {
        data: [
            {
                type: 'line',
                name: 'Orders',
                data: [12, 16, 11, 20, 18, 24, 28, 23, 31].map((y, index) => ({
                    x: Date.UTC(2026, 0, 1 + index * 7),
                    y,
                })),
            },
        ],
    },
};

export default function AdditionalAxisLevelsExample() {
    return <Chart data={data} />;
}

export const meta = {
    seriesType: 'Line',
    title: 'Additional axis label levels',
    description: 'Show days, months, and a year along one time axis.',
    docsUrl: 'pages/guides/axes/axis-labels.html#additional-levels',
    gallery: {group: 'axes'},
} satisfies ExampleMeta;
