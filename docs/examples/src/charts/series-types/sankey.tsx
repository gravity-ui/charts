import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'sankey',
                name: 'Website journeys',
                data: [
                    {
                        name: 'Search',
                        links: [
                            {name: 'Product', value: 60},
                            {name: 'Article', value: 40},
                        ],
                    },
                    {
                        name: 'Direct',
                        links: [
                            {name: 'Product', value: 30},
                            {name: 'Article', value: 20},
                        ],
                    },
                    {
                        name: 'Product',
                        links: [{name: 'Purchase', value: 90}],
                    },
                    {
                        name: 'Article',
                        links: [{name: 'Subscribe', value: 60}],
                    },
                    {
                        name: 'Purchase',
                        links: [],
                    },
                    {
                        name: 'Subscribe',
                        links: [],
                    },
                ],
            },
        ],
    },
    legend: {enabled: false},
};

export default function SankeyExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Sankey',
    title: 'Basic Sankey diagram',
    description: 'Basic Sankey configuration with named nodes and weighted links.',
    docsUrl: 'pages/guides/series-types/sankey.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
