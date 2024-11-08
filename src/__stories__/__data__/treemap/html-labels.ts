import type {ChartData, TreemapSeries} from '../../../types';

function prepareData(): ChartData {
    const styledLabel = (label: string) =>
        `<span style="padding: 2px; background-color: #0a3069;color: #fff;">${label}</span>`;
    const treemapSeries: TreemapSeries = {
        type: 'treemap',
        name: 'Example',
        dataLabels: {
            enabled: true,
            html: true,
            align: 'right',
        },
        layoutAlgorithm: 'binary',
        levels: [
            {index: 1, padding: 3},
            {index: 2, padding: 1},
        ],
        data: [
            {name: styledLabel('One'), value: 15},
            {name: styledLabel('Two'), id: 'Two'},
            {name: [styledLabel('Two'), '1'], value: 2, parentId: 'Two'},
            {name: [styledLabel('Two'), '2'], value: 8, parentId: 'Two'},
        ],
    };

    return {series: {data: [treemapSeries]}};
}

export const treemapHtmlLabelsData = prepareData();
