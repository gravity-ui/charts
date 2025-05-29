import {action} from '@storybook/addon-actions';

import type {ChartData, TreemapSeries} from '../../../types';

const prepareData = (): ChartData => {
    const treemapSeries: TreemapSeries = {
        type: 'treemap',
        name: 'Example',
        dataLabels: {
            enabled: true,
            format: {type: 'number', precision: 1},
        },
        layoutAlgorithm: 'binary',
        levels: [
            {index: 1, padding: 5},
            {index: 2, padding: 3},
            {index: 3, padding: 1},
        ],
        data: [
            {name: '1', value: 15},
            {name: '2', value: 10},
            {name: '3', value: 15},
            {name: '4'},
            {name: ['4', '1'], value: 5, parentId: '4'},
            {name: ['4', '2'], parentId: '4', id: 'Four-2'},
            {name: ['4', '3'], value: 4, parentId: '4'},
            {name: ['4', '2', '1'], value: 5, parentId: 'Four-2'},
            {name: ['4', '2', '2'], value: 7, parentId: 'Four-2'},
            {name: ['4', '2', '3'], value: 10, parentId: 'Four-2'},
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
