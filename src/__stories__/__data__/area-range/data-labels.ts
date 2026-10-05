import type {ChartData} from '../../../types';

export const areaRangeDataLabelsData: ChartData = {
    title: {text: 'Formatted intervals and a custom point label'},
    series: {
        data: [
            {
                type: 'area-range',
                name: 'Expected range',
                opacity: 0.25,
                dataLabels: {enabled: true, format: {type: 'number', precision: 1}},
                data: [
                    {x: 0, y0: 18.25, y1: 26.75},
                    {x: 1, y0: 20.15, y1: 29.45},
                    {x: 2, y0: 17.35, y1: 25.65, label: 'Revised estimate'},
                    {x: 3, y0: 19.55, y1: 31.85},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr']},
};
