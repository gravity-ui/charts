import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

export function BarYPointClickExample() {
    const [clickedPoint, setClickedPoint] = React.useState('Click a bar');
    const data = React.useMemo<ChartData>(
        () => ({
            legend: {enabled: false},
            tooltip: {enabled: false},
            xAxis: {min: 0, max: 12},
            yAxis: [{type: 'category', categories: ['Open', 'Completed'], order: 'reverse'}],
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Issues',
                        cursor: 'pointer',
                        data: [
                            {x: 10, y: 'Open'},
                            {x: 6, y: 'Completed'},
                        ],
                        events: {
                            pointClick: ({point, series}) => {
                                setClickedPoint(
                                    `${series.name}: ${String(point.y)} — ${String(point.x)}`,
                                );
                            },
                        },
                    },
                ],
            },
        }),
        [],
    );
    return (
        <div style={{height: '100%', display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto'}}>
            <Chart data={data} />
            <div aria-live="polite">{clickedPoint}</div>
        </div>
    );
}
