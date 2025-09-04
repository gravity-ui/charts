import type {TDashStyle} from '../../../constants';
import {DashStyle} from '../../../constants';
import type {ChartData, LineSeries, LineSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

const SHAPES = {
    [DashStyle.Solid]: 1,
    [DashStyle.Dash]: 2,
    [DashStyle.Dot]: 3,
    [DashStyle.ShortDashDot]: 4,
    [DashStyle.LongDash]: 5,
    [DashStyle.LongDashDot]: 6,
    [DashStyle.ShortDot]: 7,
    [DashStyle.LongDashDotDot]: 8,
    [DashStyle.ShortDash]: 9,
    [DashStyle.DashDot]: 10,
    [DashStyle.ShortDashDotDot]: 11,
};

const selectShapes = (): TDashStyle[] => Object.values(DashStyle);
const getShapesOrder = () => selectShapes().sort((a, b) => SHAPES[a] - SHAPES[b]);

const SHAPES_IN_ORDER = getShapesOrder();

function prepareData(): ChartData {
    const games = nintendoGames.filter((d) => {
        return d.date && d.user_score;
    });

    const byGenre = (genre: string) => {
        return games
            .filter((d) => d.genres.includes(genre))
            .map((d) => {
                return {
                    x: d.date,
                    y: d.user_score,
                    label: d.title,
                };
            }) as LineSeriesData[];
    };

    const data: ChartData = {
        series: {
            options: {
                line: {
                    lineWidth: 2,
                },
            },
            data: [
                {
                    name: '3D',
                    type: 'line',
                    data: byGenre('3D'),
                },
                {
                    name: '2D',
                    type: 'line',
                    data: byGenre('2D'),
                },
                {
                    name: 'Strategy',
                    type: 'line',
                    data: byGenre('Strategy'),
                },
                {
                    name: 'Shooter',
                    type: 'line',
                    data: byGenre('Shooter'),
                },
            ],
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Release date',
            },
        },
        yAxis: [
            {
                title: {text: 'User score'},
                labels: {
                    enabled: true,
                },
                ticks: {
                    pixelInterval: 120,
                },
            },
        ],
    };

    (data.series.data as LineSeries[]).forEach((graph, i) => {
        graph.dashStyle = SHAPES_IN_ORDER[i % SHAPES_IN_ORDER.length];
    });

    return data;
}

export const lineShapesData = prepareData();
