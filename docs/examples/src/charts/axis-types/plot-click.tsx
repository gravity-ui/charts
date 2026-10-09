import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';
import {Button} from '@gravity-ui/uikit';

const points = [
    {x: Date.UTC(2024, 0, 1), y: 20},
    {x: Date.UTC(2024, 0, 2), y: 35},
    {x: Date.UTC(2024, 0, 3), y: 15},
    {x: Date.UTC(2024, 0, 4), y: 30},
];
const timestamps = points.map((point) => point.x);

export function PlotClickExample() {
    const [areSeriesHidden, setAreSeriesHidden] = React.useState(false);
    const [plotSelection, setPlotSelection] = React.useState('No plot click yet');
    const [pointSelection, setPointSelection] = React.useState('No selected-point click yet');

    const data = React.useMemo<ChartData>(
        () => ({
            chart: {
                zoom: {enabled: true, type: 'x'},
                events: {
                    plotclick: ({xAxisValue}) => {
                        if (xAxisValue !== undefined) {
                            setPlotSelection(
                                `Plot date: ${new Date(xAxisValue).toISOString().slice(0, 16)} UTC`,
                            );
                        }
                    },
                    click: ({point}) => {
                        setPointSelection(
                            `Selected point: ${new Date(Number(point.x)).toISOString().slice(0, 10)}`,
                        );
                    },
                },
            },
            xAxis: {
                type: 'datetime',
                timestamps,
                min: timestamps[0],
                max: timestamps[timestamps.length - 1],
                startOnTick: false,
                endOnTick: false,
                maxPadding: 0,
                labels: {dateFormat: 'D MMM'},
            },
            yAxis: [{min: 0, max: 100}],
            series: {
                data: [
                    {
                        type: 'area',
                        name: 'Requests',
                        visible: !areSeriesHidden,
                        legend: {enabled: false},
                        data: points,
                    },
                ],
            },
            legend: {enabled: false},
            tooltip: {enabled: false},
        }),
        [areSeriesHidden],
    );

    const handleToggleSeries = () => {
        setAreSeriesHidden((hidden) => !hidden);
        setPlotSelection('No plot click yet');
        setPointSelection('No selected-point click yet');
    };

    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: 8}}>
            <div>
                <Button onClick={handleToggleSeries}>
                    {areSeriesHidden ? 'Show series' : 'Hide all series'}
                </Button>
            </div>
            <div aria-live="polite">
                <div>{plotSelection}</div>
                <div>{pointSelection}</div>
            </div>
            <div style={{flex: 1, minHeight: 0}}>
                <Chart data={data} />
            </div>
        </div>
    );
}
