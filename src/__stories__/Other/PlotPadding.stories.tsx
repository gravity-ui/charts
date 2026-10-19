import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
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

const axisData: ChartData = {
    ...data,
    chart: {plotPadding: {right: 'auto'}},
    legend: {enabled: false},
    xAxis: {min: 0, maxPadding: 0.2, startOnTick: false, endOnTick: false},
    series: {data: [data.series.data[1]]},
};

interface Example {
    title: string;
    description: string;
    data: ChartData;
}

const rows: Example[][] = [
    [
        {
            title: 'Default: no plot padding',
            description: 'Markers at fixed axis limits can extend beyond the plot.',
            data: {...data, chart: {}},
        },
        {
            title: 'Automatic padding',
            description: 'All four sides fit normal and hover markers, including scatter halos.',
            data,
        },
    ],
    [
        {
            title: 'Existing axis padding',
            description:
                'xAxis.maxPadding: 0.2 already leaves enough room; right: auto adds nothing.',
            data: axisData,
        },
        {
            title: 'Explicit axis maximum',
            description:
                'xAxis.max: 3 suppresses maxPadding; right: auto still fits the last marker.',
            data: {...axisData, xAxis: {...axisData.xAxis, max: 3}},
        },
    ],
    [
        {
            title: 'Explicit chart padding',
            description: 'right: 10% replaces automatic sizing and all type-level contributions.',
            data: {...data, chart: {plotPadding: {...auto, right: '10%'}}},
        },
        {
            title: 'Type-level contributions',
            description:
                'Line opts out on the left; scatter requests 40px. The largest contribution wins.',
            data: {
                ...data,
                series: {
                    ...data.series,
                    options: {
                        line: {plotPadding: {left: 0}},
                        scatter: {plotPadding: {left: '40px'}},
                    },
                },
            },
        },
    ],
    [
        {
            title: 'Zoom',
            description: 'Drag to zoom. Padding is recalculated for the visible domain.',
            data: {...data, chart: {plotPadding: auto, zoom: {enabled: true, type: 'xy'}}},
        },
        {
            title: 'Split plots',
            description: 'Vertical padding is independent; the shared X scale fits both plots.',
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
                    data: data.series.data.map((s) => ({
                        ...s,
                        yAxis: s.type === 'scatter' ? 1 : 0,
                    })),
                },
            },
        },
    ],
];

export default {
    title: 'Other/Plot padding',
} satisfies Meta<typeof ChartStory>;

type Story = StoryObj<typeof ChartStory>;

export const PlotPaddingStory = {
    name: 'Plot padding',
    render: () => (
        <Container spaceRow={5}>
            {rows.map((examples, index) => (
                <Row key={index} space={5}>
                    {examples.map((example) => (
                        <Col key={example.title} s={6}>
                            <Text as="div" variant="subheader-3">
                                {example.title}
                            </Text>
                            <Text as="p" variant="body-1">
                                {example.description}
                            </Text>
                            <ChartStory data={example.data} style={{height: 300}} />
                        </Col>
                    ))}
                </Row>
            ))}
        </Container>
    ),
} satisfies Story;
