import type {HeatmapSeriesData} from '../../../types';

// Create heatmap data with intentional null gaps
function createHeatmapDataWithNulls(): HeatmapSeriesData[] {
    const data: HeatmapSeriesData[] = [];
    for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 5; y++) {
            // Create null values in a pattern (every 3rd cell)
            const value = (x * 5 + y) % 3 === 0 ? null : Math.floor(Math.random() * 100);
            data.push({x, y, value});
        }
    }
    return data;
}

export const heatmapDataWithNulls = createHeatmapDataWithNulls();
