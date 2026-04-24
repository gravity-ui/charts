import type {ChartData} from '../../../types';

export const gaugeBasicData: ChartData = {
    series: {
        data: [
            {
                type: 'gauge',
                name: 'Performance',
                value: 65,
                min: 0,
                max: 100,
                unit: '%',
                thresholds: [
                    {value: 40, color: '#FF3D64', label: 'Critical'},
                    {value: 70, color: '#FFC636', label: 'Warning'},
                    {value: 100, color: '#8AD554', label: 'Good'},
                ],
                target: 80,
                pointer: {type: 'marker'},
            },
        ],
    },
};

export const gaugeNeedleData: ChartData = {
    series: {
        data: [
            {
                type: 'gauge',
                name: 'Temperature',
                value: 72,
                min: 0,
                max: 120,
                unit: '°C',
                thresholds: [
                    {value: 40, color: '#8AD554', label: 'Normal'},
                    {value: 80, color: '#FFC636', label: 'Hot'},
                    {value: 120, color: '#FF3D64', label: 'Critical'},
                ],
                pointer: {type: 'needle'},
            },
        ],
    },
};

export const gaugeSolidData: ChartData = {
    series: {
        data: [
            {
                type: 'gauge',
                name: 'Progress',
                value: 42,
                min: 0,
                max: 100,
                unit: '%',
                color: '#4DA2F1',
                pointer: {type: 'solid'},
            },
        ],
    },
};

export const gaugeGradientData: ChartData = {
    series: {
        data: [
            {
                type: 'gauge',
                name: 'CPU Load',
                value: 68,
                min: 0,
                max: 100,
                unit: '%',
                thresholds: [
                    {value: 33, color: '#8AD554', label: 'Low'},
                    {value: 66, color: '#FFC636', label: 'Medium'},
                    {value: 100, color: '#FF3D64', label: 'High'},
                ],
                pointer: {type: 'marker'},
                arc: {trackStyle: 'continuous'},
            },
        ],
    },
};
