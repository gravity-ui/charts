import React from 'react';

import {ChartStory} from '../../__stories__/ChartStory';
import type {ChartData, ChartTooltipRendererArgs} from '../../types';

function HoveredPlotsRenderer({hoveredPlots}: ChartTooltipRendererArgs) {
    const bands = hoveredPlots?.bands ?? [];
    const lines = hoveredPlots?.lines ?? [];
    return (
        <div>
            {bands.map((b, i) => (
                <div key={`band-${i}`}>{String(b.custom)}</div>
            ))}
            {lines.map((l, i) => (
                <div key={`line-${i}`}>{String(l.custom)}</div>
            ))}
        </div>
    );
}

type Props = {
    data: ChartData;
};

export const HoveredPlotsTestStory = ({data}: Props) => {
    const chartData: ChartData = {
        ...data,
        tooltip: {...data.tooltip, renderer: HoveredPlotsRenderer},
    };

    return (
        <div style={{height: 280, width: 400, display: 'inline-block'}}>
            <ChartStory data={chartData} style={{height: 280, width: 400}} />
        </div>
    );
};
