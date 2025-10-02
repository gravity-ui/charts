import type {ChartData} from '../../../../types';
import {prepareBarYStakingNormalData} from '../../bar-y';

function prepareData(): ChartData {
    const data = prepareBarYStakingNormalData();
    return {
        ...data,
        legend: {
            enabled: false,
        },
        tooltip: {
            totals: {
                enabled: true,
                aggregation: 'sum',
            },
        },
        yAxis: [
            {
                ...data.yAxis?.[0],
                title: {
                    text: '',
                },
            },
        ],
    };
}

export const tooltipTotalsSumData = prepareData();
