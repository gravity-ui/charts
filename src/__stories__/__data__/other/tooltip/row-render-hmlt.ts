import type {ChartData, ChartTooltipRowRendererArgs} from '../../../../types';

export const tooltipRowRendererHtmlData: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Revenue',
                data: [
                    {x: 'Q1', y: 1500},
                    {x: 'Q2', y: 2300},
                    {x: 'Q3', y: 1800},
                    {x: 'Q4', y: 2900},
                ],
                stacking: 'normal',
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Q1', 'Q2', 'Q3', 'Q4']},
    tooltip: {
        rowRenderer: (args: ChartTooltipRowRendererArgs) => {
            const isPositive = Number(args.value) > 1500;
            const arrow = isPositive ? '↑' : '↓';
            const arrowColor = isPositive ? 'green' : 'red';

            return `<div class="${args.className}">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${args.color}; margin-right: 6px;"></span>
                <span>${args.name}</span>
                <span style="margin-left: auto; font-weight: 600;">
                    ${args.formattedValue}
                    <span style="color: ${arrowColor}; margin-left: 4px;">${arrow}</span>
                </span>
            </div>`;
        },
    },
};
