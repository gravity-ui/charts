import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'sankey',
                    data: [
                        {
                            name: 'a',
                            links: [
                                {name: 'b', value: 100},
                                {name: 'c', value: 50},
                            ],
                        },
                        {
                            name: 'b',
                            links: [],
                        },
                        {
                            name: 'c',
                            links: [],
                        },
                    ],
                    name: 'Series 1',
                },
            ],
        },
    };
}

export const sankeyPlaygroundData = prepareData();
