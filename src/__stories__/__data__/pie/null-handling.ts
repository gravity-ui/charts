import type {PieSeriesData} from '../../../types';

// Create pie data with intentional null values
function createPieDataWithNulls(): PieSeriesData[] {
    return [
        {name: 'A', value: 100},
        {name: 'B', value: null},
        {name: 'C', value: 150},
        {name: 'D', value: null},
        {name: 'E', value: 80},
        {name: 'F', value: 120},
    ];
}

export const pieDataWithNulls = createPieDataWithNulls();
