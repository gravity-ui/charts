import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
import type {Meta, StoryObj} from '@storybook/react-webpack5';

import type {ChartData, ChartYAxis} from '../../../types';
import {ChartStory} from '../../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Axis',
    render: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

const AxisTitle = () => {
    const longText = `One dollar and eighty-seven cents. That was all.
    And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing
    the grocer and the vegetable man and the butcher until one's cheeks burned with the silent
    imputation of parsimony that such close dealing implied. Three times Della counted it.
    One dollar and eighty - seven cents.`;
    const getWidgetData = (title: ChartYAxis['title']): ChartData => ({
        yAxis: [
            {
                title,
            },
        ],
        xAxis: {
            title,
        },
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Line series',
                    data: [
                        {x: 1, y: 10},
                        {x: 2, y: 100},
                    ],
                },
            ],
        },
    });

    return (
        <Container spaceRow={5}>
            <Row space={1}>
                <Text variant="subheader-3">Text alignment</Text>
            </Row>
            <Row space={3}>
                <Col s={4}>
                    <ChartStory data={getWidgetData({text: 'Left', align: 'left'})} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData({text: 'Center', align: 'center'})} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData({text: 'Right', align: 'right'})} />
                </Col>
            </Row>
            <Row space={1}>
                <Text variant="subheader-3">Long text</Text>
            </Row>
            <Row space={3}>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({text: longText}),
                            title: {text: 'default behaviour'},
                        }}
                    />
                </Col>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({text: longText, maxRowCount: 3}),
                            title: {text: 'multiline'},
                        }}
                    />
                </Col>
            </Row>
            <Row space={1}>
                <Text variant="subheader-3">Title rotation</Text>
            </Row>
            <Row space={3}>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({text: longText, rotation: 0}),
                            title: {text: 'rotation = 0'},
                        }}
                    />
                </Col>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({text: longText, rotation: 0, maxRowCount: 3}),
                            title: {text: 'rotation = 0 + multiline'},
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export const AxisTitleStory = {
    name: 'Title',
    render: AxisTitle,
} satisfies Story;

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
                    rotation: angle,
                },
            },
        ],
        xAxis: {
            type: 'category',
            categories: data.map((d) => prefix + d.x),
            labels: {
                enabled: false,
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
                <Text variant="subheader-2">Y-axis labels rotation (single line)</Text>
            </Row>
            <Row space={3}>
                <Col s={4}>
                    <ChartStory data={getWidgetData(0)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(45)} />
                </Col>
                <Col s={4}>
                    <ChartStory data={getWidgetData(90)} />
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
                    <ChartStory data={getWidgetData(90, labelPrefix)} />
                </Col>
            </Row>
        </Container>
    );
};

export const RotatedLabelsStory = {
    name: 'Y-axis: labels rotation',
    render: RotatedLabels,
} satisfies Story;
