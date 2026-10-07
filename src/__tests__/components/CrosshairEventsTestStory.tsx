import React from 'react';

import type {BarXSeriesData, ChartData} from '../../types';

import {ChartClickEventsTestStory} from './ChartClickEventsTestStory';

interface Props {
    data: ChartData;
}

const formatPoint = (point: BarXSeriesData) => `${point.x}:${point.y}`;

export function CrosshairEventsTestStory({data}: Props) {
    return (
        <ChartClickEventsTestStory data={data} formatPoint={formatPoint} dataQa="clicked-point" />
    );
}
