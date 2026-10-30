import React from 'react';

import {Chart} from '@gravity-ui/charts';
import {migrateChartDataV1} from '@gravity-ui/charts/migration/v1';
import type {ChartDataV1} from '@gravity-ui/charts/migration/v1';

import type {ExampleMeta} from '../gallery';

const legacyData: ChartDataV1 = {
    legend: {enabled: false},
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar']},
    yAxis: [{ticks: {pixelInterval: 60}, labels: {numberFormat: {unit: 'k'}}}],
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                marker: {enabled: true},
                data: [
                    {x: 'Jan', y: 1500},
                    {x: 'Feb', y: 2000},
                    {x: 'Mar', y: 1800},
                ],
            },
        ],
    },
};

const {data} = migrateChartDataV1(legacyData);

export default function MigrationV1Example() {
    return <Chart data={data} />;
}

export const meta = {
    seriesType: 'Line',
    title: 'Migrate v1 settings',
    description: 'Keep compact numeric labels and tick spacing when converting v1 options.',
    docsUrl: 'pages/development/migration-v2.html#render-v1',
} satisfies ExampleMeta;
