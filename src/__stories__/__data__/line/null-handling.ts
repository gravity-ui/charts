import type {LineSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function createLineDataWithNulls(): LineSeriesData[] {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 20);
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 4 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
}

export const lineDataWithNulls = createLineDataWithNulls();
