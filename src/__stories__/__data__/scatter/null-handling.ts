import type {ScatterSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function createScatterDataWithNulls(): ScatterSeriesData[] {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 15);
    return dataset.map((d, i) => ({
        x: i % 3 === 0 ? null : d.date || undefined,
        y: i % 4 === 0 ? null : d.user_score || undefined,
        custom: d,
    }));
}

export const scatterDataWithNulls = createScatterDataWithNulls();
