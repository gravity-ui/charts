import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ScatterClusterData} from '../../types';

interface Props {
    data: ChartData;
}

export const ScatterClusterSourceTestStory = ({data}: Props) => {
    const [clicked, setClicked] = React.useState('');
    const chartData = React.useMemo<ChartData>(() => {
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        const summarize = (point: ScatterClusterData) =>
            JSON.stringify({
                x: point.x,
                y: point.y,
                points: point.cluster?.points.map((member, index) => ({
                    x: member.x,
                    y: member.y,
                    sameReference: member === series.data[index],
                    custom: member.custom,
                })),
            });

        return {
            ...data,
            chart: {
                ...data.chart,
                events: {
                    click: ({point}) => setClicked(summarize(point as ScatterClusterData)),
                },
            },
            tooltip: {
                ...data.tooltip,
                renderer: ({hovered}) => (
                    <output data-qa="hovered-source">
                        {summarize(hovered[0].data as ScatterClusterData)}
                    </output>
                ),
            },
        };
    }, [data]);

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa="clicked-source">{clicked}</output>
        </React.Fragment>
    );
};
