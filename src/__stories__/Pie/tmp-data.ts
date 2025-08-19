import type {ChartData} from '../../types';

export const tmpData = {
    tooltip: {
        html: true,
    },
    legend: {
        enabled: true,
        html: true,
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {
                    html: true,
                    style: {
                        fontSize: '12px',
                        fontWeight: '500',
                    },
                },
                data: [
                    {
                        name: '<span style="border-bottom: 1px solid blue;">Наличные</span>',
                        label: '<div style="height: 20px; margin-bottom: 2px; border-bottom: 1px solid blue;">Наличные</div>',
                        value: 38897911,
                    },
                    {
                        name: '<span style="border-bottom: 1px solid red;">Банковская карта</span>',
                        label: '<div style="height: 20px; margin-bottom: 2px; border-bottom: 1px solid red;">Банковская карта</div>',
                        value: 22639029,
                    },
                ],
            },
        ],
    },
} satisfies ChartData;
