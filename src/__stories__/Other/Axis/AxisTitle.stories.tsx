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
    const htmlTitleContent =
        '<span style="display: flex; justify-content: center; align-items: center;height: 40px; width: 80px; background: var(--g-color-text-info); border-radius: 4px;">Html title</span>';
    const getWidgetData = (title: ChartYAxis['title']): ChartData => ({
        yAxis: [
            {
                title,
                maxPadding: 0,
                min: 0,
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
            <Row space={1}>
                <Text variant="subheader-3">Html title</Text>
            </Row>
            <Row space={3}>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({
                                text: htmlTitleContent,
                                html: true,
                            }),
                            title: {text: 'default rotation'},
                        }}
                    />
                </Col>
                <Col s={6}>
                    <ChartStory
                        data={{
                            ...getWidgetData({
                                text: htmlTitleContent,
                                html: true,
                                rotation: 0,
                            }),
                            title: {text: 'rotation = 0'},
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
