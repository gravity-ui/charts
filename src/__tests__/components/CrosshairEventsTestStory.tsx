import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

interface Props {
    data: ChartData;
}

export function CrosshairEventsTestStory({data}: Props) {
    const [clicked, setClicked] = React.useState('');
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    click: ({point}) => setClicked(`${point.x}:${point.y}`),
                },
            },
        }),
        [data],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa="clicked-point">{clicked}</output>
        </React.Fragment>
    );
}
