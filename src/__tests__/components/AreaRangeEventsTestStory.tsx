import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

export function AreaRangeEventsTestStory({data}: {data: ChartData}) {
    const [clicked, setClicked] = React.useState('');
    const chartData: ChartData = {
        ...data,
        chart: {
            ...data.chart,
            events: {
                ...data.chart?.events,
                click: ({point}) => setClicked(`${point.y0} – ${point.y1}`),
            },
        },
    };

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa="clicked-range">{clicked}</output>
        </React.Fragment>
    );
}
