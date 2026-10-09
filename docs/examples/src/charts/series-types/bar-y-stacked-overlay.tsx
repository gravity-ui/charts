import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {stackId: 'Plan', segments: [60, 40]},
            {stackId: 'Actual', segments: [40, 35]},
        ].flatMap(({stackId, segments}) =>
            segments.map((value, index) => ({
                type: 'bar-y',
                name: `${stackId} ${index + 1}`,
                stackId,
                stacking: 'normal',
                grouping: false,
                opacity: 0.6,
                dataLabels: {enabled: true, inside: true},
                data: [{y: 'A', x: value}],
            })),
        ),
    },
    yAxis: [{type: 'category', categories: ['A']}],
};

export function BarYStackedOverlayExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
