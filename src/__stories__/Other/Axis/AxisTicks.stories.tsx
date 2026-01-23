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

const DatetimeStartOnTick = () => {
    // Datetime data that doesn't align with "nice" tick values
    const baseDate = new Date('2024-03-05T08:23:00').getTime();
    const data = [
        {x: baseDate, y: 17},
        {x: baseDate + 3 * 24 * 60 * 60 * 1000, y: 23},
        {x: baseDate + 7 * 24 * 60 * 60 * 1000, y: 41},
        {x: baseDate + 12 * 24 * 60 * 60 * 1000, y: 38},
        {x: baseDate + 18 * 24 * 60 * 60 * 1000, y: 52},
    ];

    const getWidgetData = (startOnTick: boolean, endOnTick: boolean): ChartData => ({
        title: {
            text: `startOnTick: ${startOnTick}, endOnTick: ${endOnTick}`,
        },
        yAxis: [
            {
                title: {text: 'Value'},
            },
        ],
        xAxis: {
            type: 'datetime',
            title: {text: 'Date'},
            startOnTick,
            endOnTick,
        },
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Measurements',
                    data,
                },
            ],
        },
    });

    return (
        <Container spaceRow={5}>
            <Row space={1}>
                <Text variant="subheader-2">Datetime axis: startOnTick and endOnTick</Text>
            </Row>
            <Row space={1}>
                <Text variant="body-1" color="secondary">
                    Particularly useful for datetime axes where data may not start at midnight or
                    the first of the month.
                </Text>
            </Row>
            <Row space={4}>
                <Col s={6}>
                    <ChartStory data={getWidgetData(true, true)} />
                </Col>
                <Col s={6}>
                    <ChartStory data={getWidgetData(false, false)} />
                </Col>
            </Row>
        </Container>
    );
};

export const AxisDatetimeStartOnTickStory = {
    name: 'Start and end on tick',
    render: DatetimeStartOnTick,
} satisfies Story;
