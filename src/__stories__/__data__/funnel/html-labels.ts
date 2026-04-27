import type {ChartData} from '../../../types';

function getLabelData(name: string, value: number, color: string) {
    const labelStyle = `background: ${color};color: #fff;padding: 4px 8px;border-radius: 4px;font-size: 12px;white-space: nowrap;`;
    return {
        label: `<span style="${labelStyle}">${name}: <b>${value}</b></span>`,
        color,
    };
}

function prepareData(): ChartData {
    const items = [
        {value: 1000, name: 'Visit', color: '#4fc4b7'},
        {value: 870, name: 'Sign-up', color: '#5cb8e4'},
        {value: 630, name: 'Selection', color: '#7b61ff'},
        {value: 270, name: 'Purchase', color: '#f5a623'},
        {value: 120, name: 'Review', color: '#e54560'},
    ];

    return {
        series: {
            data: [
                {
                    type: 'funnel',
                    name: 'Funnel with HTML labels',
                    dataLabels: {
                        enabled: true,
                        html: true,
                        align: 'left',
                    },
                    data: items.map((item) => ({
                        ...item,
                        ...getLabelData(item.name, item.value, item.color),
                    })),
                },
            ],
        },
        title: {text: 'Funnel with HTML labels'},
    };
}

export const funnelHtmlLabelsData = prepareData();
