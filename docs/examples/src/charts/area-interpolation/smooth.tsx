import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData, SeriesInterpolation} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const interpolation: SeriesInterpolation = {type: 'monotone'};

const data: ChartData = {
    series: {
        data: [
            {name: 'Services', values: [40, 15, 30, 20, 45]},
            {name: 'Products', values: [20, 25, 10, 35, 15]},
        ].map(({name, values}) => ({
            type: 'area',
            name,
            stacking: 'normal',
            interpolation,
            data: values.map((y, x) => ({x, y})),
        })),
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May']},
};

export default function SmoothAreaExample() {
    return <Chart data={data} />;
}

export const meta = {
    seriesType: 'Area',
    title: 'Smooth stacked areas',
    description:
        'Smooth the contributions of related quantities while keeping their layers joined.',
    docsUrl: 'pages/guides/series-types/area.html#interpolation',
} satisfies ExampleMeta;
