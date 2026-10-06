import type {ChartData} from '../../../types';

export const areaRangeNullModeSkipData = {
    title: {text: 'nullMode: "skip" (default)'},
    series: {
        data: [
            {
                type: 'area-range',
                name: 'Expected range',
                nullMode: 'skip',
                data: [
                    {x: 0, y0: 18, y1: 26},
                    {x: 1, y0: 20, y1: 29},
                    {x: 2, y0: 17, y1: null},
                    {x: 3, y0: 19, y1: 31},
                    {x: 4, y0: 22, y1: 30},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May']},
} satisfies ChartData;

export const areaRangeNullModeConnectData: ChartData = {
    ...areaRangeNullModeSkipData,
    title: {text: 'nullMode: "connect"'},
    series: {
        data: areaRangeNullModeSkipData.series.data.map((series) => ({
            ...series,
            nullMode: 'connect',
        })),
    },
};
