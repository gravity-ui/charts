import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Observations',
                data: [
                    {x: 25, y: 30},
                    {x: 49, y: 75},
                    {x: 49.1, y: 75},
                    {x: 50.1, y: 75},
                    {x: 50.2, y: 75},
                    {x: 80, y: 50},
                ],
                cluster: {
                    enabled: true,
                    layoutAlgorithm: {type: 'grid', gridSize: '50%'},
                    overlapMode: 'shift',
                    marker: {radius: 12, borderWidth: 2, borderColor: '#ffffff'},
                },
            },
        ],
    },
    xAxis: {type: 'linear', min: 0, max: 100, crosshair: {enabled: true, snap: true}},
    yAxis: [{type: 'linear', min: 0, max: 100}],
};

export function ScatterSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
