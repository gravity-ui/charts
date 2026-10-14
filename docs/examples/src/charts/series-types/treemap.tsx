import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'treemap',
                name: 'Storage',
                data: [
                    {id: 'documents', name: 'Documents'},
                    {name: 'Reports', parentId: 'documents', value: 35},
                    {name: 'Presentations', parentId: 'documents', value: 20},
                    {id: 'media', name: 'Media'},
                    {name: 'Photos', parentId: 'media', value: 30},
                    {name: 'Videos', parentId: 'media', value: 15},
                ],
            },
        ],
    },
    legend: {enabled: false},
};

export function TreemapExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
