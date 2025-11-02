import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {ChartAxis, ChartData} from '../../types';
import {ChartStory} from '../ChartStory';

const AxisTitle = () => {
    const longText = `One dollar and eighty-seven cents. That was all.
    And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing
    the grocer and the vegetable man and the butcher until one's cheeks burned with the silent
    imputation of parsimony that such close dealing implied. Three times Della counted it.
    One dollar and eighty - seven cents.`;
    const getWidgetData = (title: ChartAxis['title']): ChartData => ({
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
        </Container>
    );
};

export const AxisTitleStory: StoryObj<typeof AxisTitle> = {
    name: 'Axis title',
};

export default {
    title: 'Other',
    component: AxisTitle,
};
