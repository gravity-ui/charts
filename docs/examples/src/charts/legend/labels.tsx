import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';
import {Button} from '@gravity-ui/uikit';

import type {ExampleMeta} from '../gallery';

const data = {
    legend: {enabled: true},
    series: {
        data: [
            {name: 'North America', itemText: 'NA', values: [12, 18, 15, 22]},
            {name: 'Europe', itemText: 'EU', values: [8, 12, 10, 16]},
            {name: 'Asia Pacific', itemText: 'APAC', values: [5, 9, 14, 18]},
        ].map(({name, itemText, values}) => ({
            type: 'line',
            name,
            legend: {itemText},
            data: values.map((y, x) => ({x, y})),
        })),
    },
} satisfies ChartData;

export default function LegendLabelsExample() {
    const [updated, setUpdated] = React.useState(false);
    const chartData: ChartData = {
        ...data,
        series: {
            data: data.series.data.map((series) => ({
                ...series,
                data: series.data.map(({x, y}) => ({x, y: updated ? y + x * 2 : y})),
            })),
        },
    };
    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: 8}}>
            <Button onClick={() => setUpdated((value) => !value)}>Update data</Button>
            <div style={{flex: 1, minHeight: 0}}>
                <Chart data={chartData} />
            </div>
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Custom legend labels',
    description: 'Use short legend labels and preserve selection when data changes.',
    docsUrl: 'pages/guides/legend.html#overriding-legend-labels',
    gallery: {
        group: 'legend',
    },
} satisfies ExampleMeta;
