import type {AreaSeries, ChartData} from '../../../types';

function prepareData(): ChartData {
    const series: AreaSeries[] = [
        {
            name: 'Series 1',
            type: 'area',
            data: [
                {x: 0, y: 10},
                {x: 1, y: 15},
                {x: 2, y: 5},
            ],
            yAxis: 0,
        },
        {
            name: 'Series 2.1',
            type: 'area',
            stacking: 'normal',
            data: [
                {x: 0, y: 100},
                {x: 1, y: 50},
                {x: 2, y: 150},
            ],
            yAxis: 1,
        },
        {
            name: 'Series 2.2',
            type: 'area',
            stacking: 'normal',
            data: [
                {x: 0, y: 75},
                {x: 1, y: 25},
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

export const areaSplitData = prepareData();
