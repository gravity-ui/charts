import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
import type {Meta, StoryObj} from '@storybook/react-webpack5';

import type {ChartData} from '../../../types';
import {ChartStory} from '../../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Axis',
    render: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

const RotatedLabels = () => {
    const data = new Array(5).fill(null).map((_, index) => ({x: index, y: index}));
    const getWidgetData = (angle: number, prefix = ''): ChartData => ({
        title: {
            text: `${angle}°`,
        },
        yAxis: [
            {
                type: 'category',
                categories: data.map((d) => prefix + d.y),
                labels: {
                    enabled: false,
                },
            },
        ],
        xAxis: {
            type: 'category',
            categories: data.map((d) => prefix + d.x),
            labels: {
                rotation: angle,
            },
        },
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'Series 1',
                    data,
                },
            ],
        },
    });

    const labelPrefix = 'Long long text for line breaks ';

    return (
        <Container spaceRow={5}>
            <Row space={1}>
                <Text variant="subheader-2">X-axis labels rotation (single line)</Text>
            </Row>
            <Row space={4}>
                <Col s={4}>
                    <ChartStory data={getWidgetData(0)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(45)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(-45)} />
                </Col>
            </Row>
            <Row space={1}>
                <Text variant="subheader-2">Y-axis labels rotation (long text)</Text>
            </Row>
            <Row space={3}>
                <Col s={4}>
                    <ChartStory data={getWidgetData(0, labelPrefix)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(45, labelPrefix)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(-45, labelPrefix)} />
                </Col>
            </Row>
        </Container>
    );
};

export const XAxisRotatedLabelsStory = {
    name: 'X-axis: labels rotation',
    render: RotatedLabels,
} satisfies Story;
