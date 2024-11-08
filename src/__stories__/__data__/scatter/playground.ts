import {action} from '@storybook/addon-actions';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score);
    const data = dataset.map((d) => ({
        x: d.date || undefined,
        y: d.user_score || undefined,
        custom: d,
    }));

    const widgetData: ChartData = {
        series: {
            data: [
                {
                    type: 'scatter',
                    data,
                    name: 'Scatter series',
                },
            ],
        },
        yAxis: [
            {
                title: {
                    text: 'User score',
                },
            },
        ],
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Release dates',
            },
        },
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };

    return widgetData;
}

export const scatterPlaygroundData = prepareData();
