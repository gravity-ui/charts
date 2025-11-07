import type {BarXSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function createBarXDataWithNulls(): BarXSeriesData[] {
    const dataset = nintendoGames
        .filter((d) => d.date && d.user_score)
        .slice(0, 6)
        .sort((a, b) => (a.date || 0) - (b.date || 0));
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 2 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
}

export const barXDataWithNulls = createBarXDataWithNulls();
console.log('barXDataWithNulls', barXDataWithNulls);
