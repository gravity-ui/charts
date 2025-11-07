import {action} from 'storybook/actions';

import type {ChartData, LineSeries, LineSeriesData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(isSnap = true): ChartData {
    const games = nintendoGames.filter((d) => {
        return d.date && d.user_score;
    });

    const byGenre = (genre: string) => {
        return games
            .filter((d) => d.genres.includes(genre))
            .map((d) => {
                const releaseDate = new Date(d.date as number);
                return {
                    x: releaseDate.getTime(),
                    y: d.user_score,
                    label: `${d.title} (${d.user_score})`,
                    custom: d,
                };
            }) as LineSeriesData[];
    };
    const series: LineSeries[] = [
        {
            name: 'Strategy',
            type: 'line',
            data: byGenre('Strategy'),
            yAxis: 0,
        },
        {
            name: 'Shooter',
            type: 'line',
            data: byGenre('Shooter'),
            yAxis: 1,
        },
        {
            name: 'Puzzle',
            type: 'line',
            data: byGenre('Puzzle'),
            yAxis: 1,
        },
    ];

    return {
        series: {
            data: series,
        },
        split: {
            enable: true,
            layout: 'vertical',
            gap: '40px',
            plots: [{title: {text: 'Strategy'}}, {title: {text: 'Shooter & Puzzle'}}],
        },
        yAxis: [
            {
                crosshair: {enabled: true, color: 'red', snap: isSnap},
                title: {text: '1'},
                plotIndex: 0,
            },
            {
                crosshair: {enabled: true, color: 'blue', snap: isSnap},
                title: {text: '2'},
                plotIndex: 1,
            },
        ],
        xAxis: {
            crosshair: {enabled: true, color: 'green', snap: isSnap},
            type: 'datetime',
            labels: {
                numberFormat: {
                    showRankDelimiter: false,
                },
            },
        },
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
}

export const lineSplitCrosshairData = prepareData();
export const lineSplitCrosshairNotSnapData = prepareData(false);
