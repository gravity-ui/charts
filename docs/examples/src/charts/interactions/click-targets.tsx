import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {BarYSeriesData, ChartData, ChartInteractionItem} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

interface IssueFilter {
    label: string;
    status: string;
}

type IssueTarget = ChartInteractionItem<BarYSeriesData<IssueFilter>, 'bar-y'>;

export default function ClickTargetsExample() {
    const [selected, setSelected] = React.useState('Click a bar to select its issue filter.');
    const data: ChartData<IssueFilter, IssueTarget> = {
        legend: {enabled: false},
        tooltip: {enabled: false},
        xAxis: {min: 0},
        yAxis: [{type: 'category', categories: ['Open', 'Closed']}],
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'Issues',
                    data: [
                        {x: 12, y: 0, custom: {label: 'Open issues', status: 'open'}},
                        {x: 8, y: 1, custom: {label: 'Closed issues', status: 'closed'}},
                    ],
                },
            ],
        },
        chart: {
            events: {
                clickMode: 'plot',
                click: ({targets, chart, position}) => {
                    if (!targets || !chart || !position) {
                        return;
                    }
                    const target = targets[0];
                    if (target?.point.custom) {
                        setSelected(`Selected: ${target.point.custom.label}`);
                    } else if (!target) {
                        const closest = chart.getClosest(position);
                        setSelected(
                            closest?.point.custom
                                ? `No exact hit. Nearest category: ${closest.point.custom.label}`
                                : 'No issue category at this position.',
                        );
                    }
                },
            },
        },
    };
    return (
        <div style={{height: 300, width: '100%'}}>
            <div style={{height: 260}}>
                <Chart data={data} />
            </div>
            <div role="status">{selected}</div>
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Click targets and nearest points',
    description:
        'Select an issue filter by clicking a bar or find the nearest category in the plot.',
    docsUrl: 'pages/guides/chart-interactions.html#click-selection',
} satisfies ExampleMeta;
