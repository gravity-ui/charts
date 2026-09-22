import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {
        enabled: true,
        position: 'left',
        width: 230,
        itemMaxRowCount: 3,
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: [
                    {
                        name: 'Revenue from international enterprise customers including recurring subscriptions and support contracts',
                        value: 40,
                    },
                    {name: 'Domestic small business customers', value: 30},
                    {name: 'First line\nSecond line', value: 20},
                    {
                        name: 'VeryLongUnbrokenIdentifierThatWillWrapWithinTheLegendWidth',
                        value: 10,
                    },
                ],
            },
        ],
    },
};

export function LegendWrappingExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
