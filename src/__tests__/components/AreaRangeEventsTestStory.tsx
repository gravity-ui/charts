import React from 'react';

import type {AreaRangeSeriesData, ChartData} from '../../types';

import {ChartClickEventsTestStory} from './ChartClickEventsTestStory';

interface Props {
    data: ChartData;
}

const formatPoint = (point: AreaRangeSeriesData) => `${point.y0} — ${point.y1}`;

export function AreaRangeEventsTestStory({data}: Props) {
    return (
        <ChartClickEventsTestStory data={data} formatPoint={formatPoint} dataQa="clicked-range" />
    );
}
