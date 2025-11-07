import type {BarYSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function createBarYDataWithNulls(): {data: BarYSeriesData[]; categories: string[]} {
    const dataset = nintendoGames.filter((d) => d.title && d.user_score).slice(0, 5);
    const categories = dataset.map((d) => d.title);
    const data = dataset.map((d, i) => ({
        y: d.title,
        x: i % 2 === 0 ? null : d.user_score || undefined,
        custom: d,
    }));
    return {data, categories};
}

export const barYDataWithNulls = createBarYDataWithNulls();
