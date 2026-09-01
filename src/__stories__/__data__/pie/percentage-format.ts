import type {ChartData, PieFormatContext} from '../../../types';

const percentFormatter = new Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: 1,
});

function formatValueAndPercentage({name, value, percentage}: PieFormatContext) {
    return `${name}: ${value} (${percentFormatter.format(percentage)})`;
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
