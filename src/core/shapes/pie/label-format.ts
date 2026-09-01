import type {PieSeriesData, PieValueFormat} from '../../../types';
import type {PreparedPieSeries} from '../../series/types';
import {getFormattedValue} from '../../utils/format';

export function getPiePercentages(
    series: Array<Pick<PreparedPieSeries, 'id' | 'value'>>,
): Map<string, number> {
    const total = series.reduce((sum, item) => {
        const value = item.value ?? 0;
        return value > 0 ? sum + value : sum;
    }, 0);

    return new Map(
        series.map((item) => {
            const value = item.value ?? 0;
            const percentage = total > 0 && value > 0 ? value / total : 0;
            return [item.id, percentage];
        }),
    );
}

export function getPieDataLabelText(args: {
    data: PieSeriesData;
    format?: PieValueFormat;
    percentage: number;
}): string {
    const {data, format, percentage} = args;

    return getFormattedValue({
        value: data.label ?? data.value,
        format,
        context: {percentage, name: data.name, data},
    });
}
