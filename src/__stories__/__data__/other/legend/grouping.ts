import type {ChartData} from '../../../../types';

export const groupedLegend: ChartData = {
    xAxis: {maxPadding: 0},
    yAxis: [{maxPadding: 0}],
    chart: {margin: {top: 10, bottom: 10, right: 10, left: 10}},
    series: {
        data: [
            {
                type: 'scatter',
                name: 'Series 1.1',
                data: [{x: 1.1, y: 1.1}],
                legend: {groupId: 's1', itemText: 'Series 1'},
            },
            {
                type: 'scatter',
                name: 'Series 1.2',
                data: [{x: 1.2, y: 1.2}],
                legend: {groupId: 's1'},
            },
            {type: 'scatter', name: 'Series 2', data: [{x: 2, y: 2}]},
            {type: 'scatter', name: 'Series 3', data: [{x: 3, y: 3}]},
        ],
    },
};
