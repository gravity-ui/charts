import React from 'react';

import {ChartStory} from '../../__stories__/ChartStory';

const segmentValueFormat = {
    type: 'custom' as const,
    formatter: ({value}: {value: unknown}) => `data:${value}`,
};

const chartValueFormat = {
    type: 'custom' as const,
    formatter: ({value}: {value: unknown}) => `chart:${value}`,
};

export const FunnelTooltipValueFormatStory = () => {
    const data = {
        series: {
            data: [
                {
                    type: 'funnel' as const,
                    name: 'Funnel',
                    data: [
                        {
                            value: 100,
                            name: 'Visit',
                            tooltip: {valueFormat: segmentValueFormat},
                        },
                        {value: 50, name: 'Purchase'},
                    ],
                },
            ],
        },
        tooltip: {valueFormat: chartValueFormat},
        legend: {enabled: false},
    };

    return (
        <div style={{width: 600, height: 400}}>
            <ChartStory data={data} style={{width: 600, height: 400}} />
        </div>
    );
};
