import type {ChartData} from '../../../types';

/**
 * Small pie with many segments and tall multiline HTML labels.
 * Used to verify overlap handling: a failed placement should skip only the
 * conflicting label, while later labels can still be rendered.
 */
export const pieDenseMultilineHtmlLabelsData: ChartData = {
    legend: {
        enabled: false,
    },
    series: {
        data: [
            {
                type: 'pie',
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    html: true,
                },
                data: [
                    {
                        name: '16 (A)',
                        value: 0.73,
                        label: '16 (A)<br/>0.26%<br/>0.73',
                        color: '#7EBA28',
                    },
                    {
                        name: '32 (A)',
                        value: 8.53,
                        label: '32 (A)<br/>3.01%<br/>8.53',
                        color: '#00A1C9',
                    },
                    {
                        name: '64 (A)',
                        value: 10.97,
                        label: '64 (A)<br/>3.87%<br/>10.97',
                        color: '#EFB118',
                    },
                    {
                        name: '128 (A)',
                        value: 12.43,
                        label: '128 (A)<br/>4.39%<br/>12.43',
                        color: '#FF725C',
                    },
                    {
                        name: '256 (A)',
                        value: 12.92,
                        label: '256 (A)<br/>4.56%<br/>12.92',
                        color: '#00A878',
                    },
                    {
                        name: '512 (A)',
                        value: 21.9,
                        label: '512 (A)<br/>7.74%<br/>21.90',
                        color: '#9498A0',
                    },
                    {
                        name: '1024 (A)',
                        value: 20.07,
                        label: '1024 (A)<br/>7.09%<br/>20.07',
                        color: '#4269D0',
                    },
                    {
                        name: '2048 (A)',
                        value: 5.23,
                        label: '2048 (A)<br/>1.85%<br/>5.23',
                        color: '#E17C05',
                    },
                    {
                        name: '4096 (A)',
                        value: 1.32,
                        label: '4096 (A)<br/>0.47%<br/>1.32',
                        color: '#8080EA',
                    },
                    {
                        name: '8192 (A)',
                        value: 0.25,
                        label: '8192 (A)<br/>0.09%<br/>0.25',
                        color: '#D84A3A',
                    },
                    {
                        name: '16 (B)',
                        value: 0.73,
                        label: '16 (B)<br/>0.26%<br/>0.73',
                        color: '#7EBA28',
                    },
                    {
                        name: '32 (B)',
                        value: 8.53,
                        label: '32 (B)<br/>3.01%<br/>8.53',
                        color: '#00A1C9',
                    },
                    {
                        name: '64 (B)',
                        value: 10.97,
                        label: '64 (B)<br/>3.87%<br/>10.97',
                        color: '#EFB118',
                    },
                    {
                        name: '128 (B)',
                        value: 12.43,
                        label: '128 (B)<br/>4.39%<br/>12.43',
                        color: '#FF725C',
                    },
                    {
                        name: '256 (B)',
                        value: 12.92,
                        label: '256 (B)<br/>4.56%<br/>12.92',
                        color: '#00A878',
                    },
                    {
                        name: '512 (B)',
                        value: 21.9,
                        label: '512 (B)<br/>7.74%<br/>21.90',
                        color: '#9498A0',
                    },
                    {
                        name: '1024 (B)',
                        value: 20.07,
                        label: '1024 (B)<br/>7.09%<br/>20.07',
                        color: '#4269D0',
                    },
                    {
                        name: '2048 (B)',
                        value: 5.23,
                        label: '2048 (B)<br/>1.85%<br/>5.23',
                        color: '#E17C05',
                    },
                    {
                        name: '4096 (B)',
                        value: 1.32,
                        label: '4096 (B)<br/>0.47%<br/>1.32',
                        color: '#8080EA',
                    },
                    {
                        name: '8192 (B)',
                        value: 0.25,
                        label: '8192 (B)<br/>0.09%<br/>0.25',
                        color: '#D84A3A',
                    },
                ],
            },
        ],
    },
};
