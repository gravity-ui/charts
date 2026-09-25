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
                        const cluster = point as ScatterClusterData<{id: string}>;
                        const ids = cluster.clusteredData.map((item) => item.custom?.id).join(',');
                        setClickedCluster(`${cluster.clusterSize}:${ids}`);
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
