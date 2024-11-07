import type {AreaSeriesData, ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const games = nintendoGames.filter((d) => {
        return d.date && d.user_score && d.genres.includes('Puzzle');
    });

    return {
        series: {
            data: [
                {
                    name: 'User score',
                    type: 'area',
                    data: games.map<AreaSeriesData>((d) => {
                        return {
                            x: Number(d.date),
                            y: Number(d.user_score),
                        };
                    }),
                },
            ],
        },
        xAxis: {
            type: 'datetime',
        },
    };
}

export const areaBasicData = prepareData();
