import {groups} from 'd3';

import type {BarYSeries, BarYSeriesData, ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(isSnap = true): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data = gamesByPlatform.map(([value, games]) => ({
        y: value,
        x: games.length,
    })) as BarYSeriesData[];
    const categories = gamesByPlatform.map(([key]) => key);
    const series = [{data, name: 'Games released'}] as BarYSeries[];

    return {
        series: {
            data: series.map<BarYSeries>((s) => ({
                type: 'bar-y',
                data: s.data as BarYSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {
            crosshair: {
                enabled: true,
                color: '#ff0016',
                snap: isSnap,
            },
            title: {text: 'Number of games released'},
        },
        yAxis: [
            {
                crosshair: {
                    enabled: true,
                    color: '#9b33b8',
                    width: 2,
                    snap: isSnap,
                },
                type: 'category',
                categories: categories.map(String),
                title: {
                    text: 'Game Platforms',
                },
            },
        ],
    };
}

export const barYCrosshairData = prepareData();
export const barYCrosshairNotSnapData = prepareData(false);
