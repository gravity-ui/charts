import React from 'react';

import {ChartStory} from '../../src/__stories__/ChartStory';
import type {ChartData} from '../../src/types';

type Props = {
    data: ChartData;
    styles?: React.CSSProperties;
};

export const ChartTestStory = ({data, styles}: Props) => {
    const storyStyles: React.CSSProperties = {
        height: 280,
        width: 400,
        display: 'inline-block',
        ...styles,
    };

    return (
        <div style={storyStyles}>
            <ChartStory data={data} />
        </div>
    );
};
