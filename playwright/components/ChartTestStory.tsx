import React from 'react';

import set from 'lodash/set';

import {ChartStory} from '../../src/__stories__/ChartStory';
import type {ChartData} from '../../src/types';
import {CustomShapeRenderer} from '../../src/utils';

type Props = {
    data: ChartData;
    styles?: React.CSSProperties;
    customShape?: {text: string; padding?: number; minFontSize?: number};
};

export const ChartTestStory = ({data, styles, customShape}: Props) => {
    const storyStyles: React.CSSProperties = {
        height: 280,
        width: 400,
        display: 'inline-block',
        ...styles,
    };

    if (customShape) {
        set(
            data.series.data[0],
            'renderCustomShape',
            CustomShapeRenderer.pieCenterText(customShape.text, {
                padding: customShape.padding,
                minFontSize: customShape.minFontSize,
            }),
        );
    }

    return (
        <div style={storyStyles}>
            <ChartStory
                data={data}
                style={{height: storyStyles.height, width: storyStyles.width}}
            />
        </div>
    );
};
