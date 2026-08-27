import React from 'react';

import {ChartStory} from '../../__stories__/ChartStory';
import type {ChartData} from '../../types';

const percentageFormatter = {
    type: 'custom' as const,
    formatter: ({value, percentage}: {value: unknown; percentage?: number}) =>
        `${value} (${Math.round((percentage ?? 0) * 100)}%)`,
};

function getData(hideSliceC: boolean): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'pie',
                    dataLabels: {
                        enabled: true,
                        format: percentageFormatter,
                    },
                    data: [
                        {name: 'A', value: 10, label: '10 (40%)'},
                        {name: 'B', value: 10, label: '10 (40%)'},
                        {
                            name: 'C',
                            value: 5,
                            label: '5 (20%)',
                            ...(hideSliceC ? {visible: false} : {}),
                        },
                    ],
                },
            ],
        },
        legend: {enabled: false},
        tooltip: {enabled: false},
    };
}

type Props = {
    hideSliceC?: boolean;
    onRender?: (renderTime?: number) => void;
};

export const PieDataLabelPercentageStory = ({hideSliceC = false, onRender}: Props) => {
    return (
        <div style={{width: 400, height: 400}}>
            <ChartStory
                data={getData(hideSliceC)}
                style={{width: 400, height: 400}}
                onRender={onRender}
            />
        </div>
    );
};
