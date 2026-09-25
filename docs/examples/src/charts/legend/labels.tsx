import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
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
};

export function LegendLabelsExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
