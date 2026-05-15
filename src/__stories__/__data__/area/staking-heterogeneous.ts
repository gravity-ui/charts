import type {AreaSeries, ChartData} from '../../../types';

const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function prepareData(): ChartData {
    const seriesData: AreaSeries[] = [
        {
            type: 'area',
            stacking: 'normal',
            name: 'Series A (Jan, Feb, Mar)',
            data: [
                {x: 'Jan', y: 10},
                {x: 'Feb', y: 20},
                {x: 'Mar', y: 15},
            ],
        },
        {
            type: 'area',
            stacking: 'normal',
            name: 'Series B (Mar, Apr, May)',
            data: [
                {x: 'Mar', y: 25},
                {x: 'Apr', y: 30},
                {x: 'May', y: 18},
            ],
        },
        {
            type: 'area',
            stacking: 'normal',
            name: 'Series C (May, Jun)',
            data: [
                {x: 'May', y: 12},
                {x: 'Jun', y: 22},
            ],
        },
    ];

    return {
        series: {
            data: seriesData,
        },
        xAxis: {
            type: 'category',
            categories,
        },
    };
}

export const areaStakingHeterogeneousData = prepareData();
