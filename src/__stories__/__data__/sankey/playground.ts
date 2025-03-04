import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    // [
    //     {"source": 'A1',"target": 'B1', value: 67.66666666666667},
    //     {"source": 'A2',"target": 'B2', "value": 87},
    //     {"source": 'A3',"target": 'B3', "value": 92},
    //     {"source": 'A3',"target": 'B4', "value": 88},
    //     {"source": 'A1',"target": 'B5', "value":  65},
    //     {"source": 'B5',"target": 'C1', "value":  100}];

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
