import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {BarXSeriesEvents, ChartData} from '@gravity-ui/charts';

export function BarXPointClickExample() {
    const [nearestPoint, setNearestPoint] = React.useState('No chart click yet');
    const [clickedPoint, setClickedPoint] = React.useState('No column click yet');

    const data = React.useMemo<ChartData>(() => {
        const events: BarXSeriesEvents = {
            pointClick: ({point, series}) => {
                setClickedPoint(`${series.name}: x=${String(point.x)}, y=${String(point.y)}`);
            },
        };

        return {
            chart: {
                events: {
                    click: ({point, series}) => {
                        setNearestPoint(
                            `${String(series.name)}: x=${String(point.x)}, y=${String(point.y)}`,
                        );
                    },
                },
            },
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Planned',
                        color: '#4da2f1',
                        borderWidth: 2,
                        data: [{x: 0, y: 10}],
                        events,
                    },
                    {
                        type: 'bar-x',
                        name: 'Completed',
                        color: '#8ad554',
                        borderWidth: 2,
                        data: [{x: 0, y: 8}],
                        events,
                    },
                    {
                        type: 'line',
                        name: 'Completion',
                        color: '#ff7700',
                        yAxis: 1,
                        data: [{x: 0, y: 50}],
                        marker: {enabled: true},
                    },
                ],
            },
            xAxis: {type: 'category', categories: ['Current period']},
            yAxis: [
                {min: 0, max: 15},
                {min: 0, max: 100},
            ],
            tooltip: {pin: {enabled: true}},
        };
    }, []);

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateRows: 'minmax(0, 1fr) auto auto',
                height: '100%',
                gap: 8,
            }}
        >
            <div style={{minHeight: 0}}>
                <Chart data={data} />
            </div>
            <div aria-live="polite">Nearest point: {nearestPoint}</div>
            <div aria-live="polite">Clicked column: {clickedPoint}</div>
        </div>
    );
}
