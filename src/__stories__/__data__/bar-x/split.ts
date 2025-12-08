import type {BarXSeries, ChartData} from '../../../types';

function prepareData(): ChartData {
    const series: BarXSeries[] = [
        {
            name: 'Series 1',
            type: 'bar-x',
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
            data: [
                {x: 0, y: 100},
                {x: 1, y: 150},
                {x: 2, y: 50},
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
            plots: [{title: {text: 'Plot title 1'}}, {title: {text: 'Plot title 2'}}],
        },
        xAxis: {categories: ['Apple', 'Banana', 'Carror'], type: 'category'},
        yAxis: [
            {
                title: {text: '1'},
                plotIndex: 0,
            },
            {
                title: {text: '2'},
                plotIndex: 1,
            },
        ],
    };
}

export const barXSplitData = prepareData();
