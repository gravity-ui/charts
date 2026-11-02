import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

interface Props {
    desktopValue: number;
    stacking: 'normal' | 'percent';
    aggregation: 'sum' | 'orders';
}

export function AreaStackLabelsGapsTestStory({desktopValue, stacking, aggregation}: Props) {
    const data: ChartData<{orders: number}> = {
        xAxis: {type: 'category', categories: ['A', 'B', 'C']},
        yAxis: [{min: 0, max: stacking === 'percent' ? 100 : 70}],
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Desktop',
                    stacking,
                    data: [null, desktopValue, desktopValue].map((y, x) => ({
                        x,
                        y,
                        custom: {orders: 12},
                    })),
                },
                {
                    type: 'area',
                    name: 'Mobile',
                    stacking,
                    data: [20, 20, null].map((y, x) => ({x, y, custom: {orders: 8}})),
                },
            ],
            options: {
                area: {
                    stackLabels: {
                        enabled: true,
                        allowOverlap: true,
                        aggregation:
                            aggregation === 'sum'
                                ? 'sum'
                                : ({points}) =>
                                      points.reduce(
                                          (sum, point) => sum + (point.custom?.orders ?? 0),
                                          0,
                                      ),
                        format: {type: 'number', precision: 0},
                    },
                },
            },
        },
    };

    return <ChartTestStory data={data} styles={{width: 600, height: 320}} />;
}
