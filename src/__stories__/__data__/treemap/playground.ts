import {action} from '@storybook/addon-actions';

import type {ChartData, TreemapSeries} from '../../../types';

const prepareData = (): ChartData => {
    const treemapSeries: TreemapSeries = {
        type: 'treemap',
        name: 'Example',
        dataLabels: {
            enabled: true,
            numberFormat: {precision: 1},
        },
        layoutAlgorithm: 'binary',
        levels: [
            {index: 1, padding: 5},
            {index: 2, padding: 3},
            {index: 3, padding: 1},
        ],
        data: [
            {name: 'One', value: 15},
            {name: 'Two', value: 10},
            {name: 'Three', value: 15},
            {name: 'Four'},
            {name: ['Four', '1'], value: 5, parentId: 'Four'},
            {name: 'Four-2', parentId: 'Four'},
            {name: 'Four-3', value: 4, parentId: 'Four'},
            {name: 'Four-2-1', value: 5, parentId: 'Four-2'},
            {name: 'Four-2-2', value: 7, parentId: 'Four-2'},
            {name: 'Four-2-3', value: 10, parentId: 'Four-2'},
        ],
    };

    return {
        series: {
            data: [treemapSeries],
        },
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
};

export const treemapPlaygroundData = prepareData();
