import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Rising',
                data: [
                    {x: 0, y: 30},
                    {x: 1, y: 40},
                    {x: 2, y: 50},
                ],
                dataLabels: {enabled: true, placement: 'auto'},
            },
            {
                type: 'line',
                name: 'Falling',
                data: [
                    {x: 0, y: 50},
                    {x: 1, y: 40},
                    {x: 2, y: 30},
                ],
                dataLabels: {enabled: true, placement: 'auto'},
            },
        ],
    },
    yAxis: [{min: 0, max: 80}],
};

export function DataLabelsPlacementAutoExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
