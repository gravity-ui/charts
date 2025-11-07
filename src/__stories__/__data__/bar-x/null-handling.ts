import type {BarXSeriesData} from '../../../types';

function createBarXDataWithNulls(): BarXSeriesData[] {
    const data: BarXSeriesData[] = [];
    for (let i = 0; i < 8; i++) {
        data.push({
            x: i,
            y: i % 2 === 0 ? null : Math.round(50 + Math.random() * 50),
        });
    }
    return data;
}

export const barXDataWithNulls = createBarXDataWithNulls();
