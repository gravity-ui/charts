import type {WaterfallSeriesData} from '../../../types';

// Create waterfall data with intentional null gaps
function createWaterfallDataWithNulls(): WaterfallSeriesData[] {
    return [
        {x: 'Jan', y: 150},
        {x: 'Feb', y: null},
        {x: 'Mar', y: -50},
        {x: 'Apr', y: 80},
        {x: 'May', y: null},
        {x: 'Jun', y: -30},
        {x: 'Total', y: 0, total: true},
    ];
}

export const waterfallDataWithNulls = createWaterfallDataWithNulls();
