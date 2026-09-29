import type {ChartData, PieFormatContext} from '../../../types';

const percentFormatter = new Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: 1,
});

function formatValueAndPercentage({name, value, percentage}: PieFormatContext) {
    const label = name === undefined ? String(value) : `${name}: ${value}`;
    return percentage === undefined ? label : `${label} (${percentFormatter.format(percentage)})`;
}

const percentageFormat = {
    type: 'custom' as const,
    formatter: formatValueAndPercentage,
};

export const piePercentageFormatData: ChartData = {
    legend: {enabled: true},
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {format: percentageFormat},
                tooltip: {valueFormat: percentageFormat},
                data: [
                    {name: 'Desktop', value: 60},
                    {name: 'Mobile', value: 30},
                    {name: 'Tablet', value: 10},
                ],
            },
        ],
    },
};
