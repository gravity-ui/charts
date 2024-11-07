import React from 'react';

import type {PreparedTitle} from '../../hooks';
import {block} from '../../utils';

import './styles.scss';

const b = block('d3-title');

type Props = PreparedTitle & {
    chartWidth: number;
};

export const Title = (props: Props) => {
    const {chartWidth, text, height, style} = props;

    return (
        <text
            className={b()}
            dx={chartWidth / 2}
            dy={height / 2}
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
                lineHeight: `${height}px`,
                ...style,
            }}
        >
            <tspan>{text}</tspan>
        </text>
    );
};
