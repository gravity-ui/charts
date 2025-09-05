import type {DashStyle} from '../../../constants';
import {DASH_STYLE} from '../../../constants';
import type {ChartData, LineSeries, LineSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

const SHAPES = {
    [DASH_STYLE.Solid]: 1,
    [DASH_STYLE.Dash]: 2,
    [DASH_STYLE.Dot]: 3,
    [DASH_STYLE.ShortDashDot]: 4,
    [DASH_STYLE.LongDash]: 5,
    [DASH_STYLE.LongDashDot]: 6,
    [DASH_STYLE.ShortDot]: 7,
    [DASH_STYLE.LongDashDotDot]: 8,
    [DASH_STYLE.ShortDash]: 9,
    [DASH_STYLE.DashDot]: 10,
    [DASH_STYLE.ShortDashDotDot]: 11,
};

const selectShapes = (): DashStyle[] => Object.values(DASH_STYLE);
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
