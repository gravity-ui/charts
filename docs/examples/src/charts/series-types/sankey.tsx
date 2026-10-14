import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

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
