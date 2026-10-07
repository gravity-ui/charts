import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

interface Props<Point> {
    data: ChartData;
    formatPoint: (point: Point) => string;
    dataQa: string;
}

export function ChartClickEventsTestStory<Point>({data, formatPoint, dataQa}: Props<Point>) {
    const [clicked, setClicked] = React.useState('');
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    click: ({point}) => setClicked(formatPoint(point)),
                },
            },
        }),
        [data, formatPoint],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa={dataQa}>{clicked}</output>
        </React.Fragment>
    );
}
