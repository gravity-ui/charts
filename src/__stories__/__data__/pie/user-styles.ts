import type {ChartData} from '../../../types';

export const pieUserStylesData: ChartData = {
    series: {
        data: [
            {
                type: 'pie',
                borderRadius: 5,
                borderWidth: 3,
                center: ['25%', null],
                dataLabels: {enabled: true},
                data: [
                    {
                        name: 'One 1',
                        value: 50,
                        radius: '80%',
                    },
                    {
                        name: 'Two 1',
                        value: 20,
                        radius: '90%',
                    },
                    {
                        name: 'Three 1',
                        value: 90,
                        radius: '100%',
                    },
                ],
            },
            {
                type: 'pie',
                borderRadius: 5,
                borderWidth: 3,
                center: ['75%', null],
                innerRadius: '50%',
                radius: '75%',
                dataLabels: {enabled: false},
                data: [
                    {
                        name: 'One 2',
                        value: 50,
                    },
                    {
                        name: 'Two 2',
                        value: 20,
                    },
                    {
                        name: 'Three 2',
                        value: 90,
                    },
                ],
            },
        ],
    },
    title: {text: 'Styled pies'},
    legend: {enabled: false},
    tooltip: {enabled: true},
};
