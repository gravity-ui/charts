import React from 'react';

import {get} from 'es-toolkit/compat';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ScatterClusterData} from '../../types';

interface Props {
    data: ChartData;
    styles?: React.CSSProperties;
}

function describePoint(series: unknown, point: unknown) {
    const cluster = (point as ScatterClusterData<{id: string}>).cluster;
    const members = cluster ? `:${cluster.points.map((item) => item.custom?.id).join(',')}` : '';
    return `${get(series, 'name')}${members}`;
}

/** Shows the active (closest) series of the tooltip and of the last click, with cluster members. */
export const ActiveSeriesTestStory = ({data, styles}: Props) => {
    const [clicked, setClicked] = React.useState('');
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    click: ({point, series}) => setClicked(describePoint(series, point)),
                },
            },
            tooltip: {
                ...data.tooltip,
                renderer: ({hovered}) => {
                    const active = hovered.find((item) => item.closest);
                    return (
                        <output data-qa="hovered-active">
                            {active ? describePoint(active.series, active.data) : ''}
                        </output>
                    );
                },
            },
        }),
        [data],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} styles={styles} />
            <output data-qa="clicked-active">{clicked}</output>
        </React.Fragment>
    );
};
