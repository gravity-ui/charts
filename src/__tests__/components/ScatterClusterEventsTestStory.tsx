import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ScatterClusterData} from '../../types';

interface Props {
    data: ChartData;
}

export const ScatterClusterEventsTestStory = ({data}: Props) => {
    const [clickedCluster, setClickedCluster] = React.useState('');
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    click: ({point}) => {
                        const cluster = (point as ScatterClusterData<{id: string}>).cluster;
                        if (!cluster) {
                            return;
                        }
                        const ids = cluster.points.map((item) => item.custom?.id).join(',');
                        setClickedCluster(`${cluster.size}:${ids}`);
                    },
                },
            },
        }),
        [data],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa="clicked-cluster">{clickedCluster}</output>
        </React.Fragment>
    );
};
