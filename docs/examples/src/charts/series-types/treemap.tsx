import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'treemap',
                name: 'Storage',
                layoutAlgorithm: 'squarify',
                levels: [{index: 1, padding: 8}],
                data: [
                    {id: 'documents', name: 'Documents'},
                    {name: 'Reports', parentId: 'documents', value: 35},
                    {name: 'Presentations', parentId: 'documents', value: 20},
                    {name: 'Spreadsheets', parentId: 'documents', value: 15},
                    {id: 'media', name: 'Media'},
                    {name: 'Photos', parentId: 'media', value: 30},
                    {name: 'Videos', parentId: 'media', value: 15},
                    {name: 'Audio', parentId: 'media', value: 10},
                ],
            },
        ],
    },
    legend: {enabled: false},
};

export default function TreemapExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Treemap',
    title: 'Basic treemap',
    description: 'Hierarchical data with a squarified layout and padding between groups.',
    docsUrl: 'pages/guides/series-types/treemap.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
