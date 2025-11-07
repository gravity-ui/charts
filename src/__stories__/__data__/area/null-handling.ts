import type {AreaSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

// Create data with intentional null gaps (every 2nd item)
function createAreaDataWithNulls(): AreaSeriesData[] {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 10);
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 2 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
}

export const areaDataWithNulls = createAreaDataWithNulls();
