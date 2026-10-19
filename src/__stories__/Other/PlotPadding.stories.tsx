import type {Meta, StoryObj} from '@storybook/react';

import type {ChartData, ChartPlotPadding} from '../../types';
import {ChartStory} from '../ChartStory';

const auto: ChartPlotPadding = {top: 'auto', right: 'auto', bottom: 'auto', left: 'auto'};
const data: ChartData = {
    chart: {plotPadding: auto},
    xAxis: {type: 'linear', min: 0, max: 3},
    yAxis: [{min: 0, max: 100}],
    series: {
        data: [
            {
                type: 'area-range',
                name: 'Forecast range',
                marker: {enabled: true, radius: 8},
                data: [
                    {x: 0, y0: 10, y1: 40},
                    {x: 1, y0: 30, y1: 60},
                    {x: 2, y0: 50, y1: 80},
                    {x: 3, y0: 60, y1: 100},
                ],
            },
            {
                type: 'line',
                name: 'Revenue',
                marker: {enabled: true, radius: 12, borderWidth: 2},
                data: [
                    {x: 0, y: 30},
                    {x: 1, y: 50},
                    {x: 2, y: 65},
                    {x: 3, y: 80},
                ],
            },
            {
                type: 'scatter',
                name: 'Observations',
                data: [
                    {x: 0, y: 20, radius: 15},
                    {x: 1, y: 55, radius: 8},
                    {x: 3, y: 90, radius: 15},
                ],
            },
        ],
    },
};

export default {
    title: 'Other/Plot padding',
    render: ChartStory,
    args: {data, style: {height: 350}},
} satisfies Meta<typeof ChartStory>;
type Story = StoryObj<typeof ChartStory>;

export const Automatic = {} satisfies Story;
export const Disabled = {args: {data: {...data, chart: {plotPadding: {}}}}} satisfies Story;
export const ExplicitOverrides = {
    args: {
        data: {
            ...data,
            chart: {plotPadding: {...auto, right: '10%'}},
            series: {
                ...data.series,
                options: {line: {plotPadding: {left: 0}}, scatter: {plotPadding: {left: '40px'}}},
            },
        },
    },
} satisfies Story;
export const Zoom = {
    args: {data: {...data, chart: {plotPadding: auto, zoom: {enabled: true, type: 'xy'}}}},
} satisfies Story;
export const Split = {
    args: {
        data: {
            ...data,
            split: {
                enable: true,
                plots: [{title: {text: 'Revenue'}}, {title: {text: 'Observations'}}],
            },
            yAxis: [
                {min: 0, max: 100, plotIndex: 0},
                {min: 0, max: 100, plotIndex: 1},
            ],
            series: {
                ...data.series,
                data: data.series.data.map((s) => ({...s, yAxis: s.type === 'scatter' ? 1 : 0})),
            },
        },
    },
} satisfies Story;
