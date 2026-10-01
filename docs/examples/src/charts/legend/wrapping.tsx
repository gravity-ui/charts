import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {
        enabled: true,
        position: 'left',
        layout: 'vertical',
        width: 'auto',
        maxWidth: '40%',
        itemMaxRowCount: 3,
        title: {text: 'Customer segments'},
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
        <div
            style={{
                height: '100%',
                width: '100%',
                minWidth: 200,
                maxWidth: '100%',
                resize: 'horizontal',
                overflow: 'auto',
            }}
        >
            <Chart data={data} />
        </div>
    );
}
