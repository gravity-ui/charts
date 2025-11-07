import type {ScatterSeriesData} from '../../../types';

function createScatterDataWithNulls(): ScatterSeriesData[] {
    const data: ScatterSeriesData[] = [];
    for (let i = 0; i < 15; i++) {
        data.push({
            x: i % 3 === 0 ? null : i * 10,
            y: i % 4 === 0 ? null : Math.round(50 + Math.random() * 50),
        });
    }
    return data;
}

export const scatterDataWithNulls = createScatterDataWithNulls();
