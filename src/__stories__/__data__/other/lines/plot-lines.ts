import {groups} from 'd3';

import type {BarYSeries, BarYSeriesData, ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data = gamesByPlatform.map(([value, games]) => ({
        y: value,
        x: games.length,
    })) as BarYSeriesData[];
    const categories = gamesByPlatform.map(([key]) => key);
    const series = [{data, name: 'Games released'}] as BarYSeries[];

    // Calculate the average number of games
    const averageGames = data.reduce((sum, item) => sum + (item.x as number), 0) / data.length;

    return {
        series: {
            data: series.map<BarYSeries>((s) => ({
                type: 'bar-y',
                data: s.data as BarYSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {
            title: {text: 'Number of games released'},
            // Add a vertical line at the average number of games
            plotLines: [
                {
                    value: averageGames,
                    color: '#FF3D64', // Using a color from the DEFAULT_PALETTE
                    width: 2,
                    dashStyle: 'Dash',
                    opacity: 0.8,
                    layerPlacement: 'after', // Line in front of the graph
                },
                {
                    value: averageGames / 2, // Half of the average
                    color: '#4DA2F1', // Another color from the DEFAULT_PALETTE
                    width: 2,
                    dashStyle: 'Dot',
                    opacity: 0.6,
                    layerPlacement: 'before', // Line behind the graph
                },
            ],
        },
        yAxis: [
            {
                type: 'category',
                categories: categories.map(String),
                title: {
                    text: 'Game Platforms',
                },
            },
        ],
    };
}

export const barYPlotLinesData = prepareData();
