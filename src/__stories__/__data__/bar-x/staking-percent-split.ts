import type {BarXSeries, ChartData} from '../../../types';

function prepareData(): ChartData {
    const series: BarXSeries[] = [
        {
            name: 'Series 1',
            type: 'bar-x',
            stacking: 'percent',
            data: [
                {x: 0, y: 10},
                {x: 1, y: 15},
                {x: 2, y: 5},
            ],
            yAxis: 0,
        },
        {
            name: 'Series 2',
            type: 'bar-x',
            stacking: 'percent',
            data: [
                {x: 0, y: 30},
                {x: 1, y: 20},
                {x: 2, y: 40},
            ],
            yAxis: 0,
        },
        {
            name: 'Series 3',
            type: 'bar-x',
            stacking: 'percent',
            data: [
                {x: 0, y: 100},
                {x: 1, y: 150},
                {x: 2, y: 50},
            ],
            yAxis: 1,
        },
        {
            name: 'Series 4',
            type: 'bar-x',
            stacking: 'percent',
            data: [
                {x: 0, y: 80},
                {x: 1, y: 60},
                {x: 2, y: 90},
            ],
            yAxis: 1,
        },
    ];

    return {
        series: {
            data: series,
        },
        split: {
            enable: true,
            gap: '40px',
            plots: [{title: {text: 'Plot 1'}}, {title: {text: 'Plot 2'}}],
        },
        xAxis: {categories: ['Apple', 'Banana', 'Carrot'], type: 'category'},
        yAxis: [
            {
                plotIndex: 0,
            },
            {
                plotIndex: 1,
            },
        ],
    };
}

export const barXStackingPercentSplitData = prepareData();
