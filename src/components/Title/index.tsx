import React from 'react';

import type {PreparedTitle} from '../../hooks';
import {block} from '../../utils';

const b = block('title');

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
                fill: style?.fontColor,
                fontSize: style?.fontSize,
                fontWeight: style?.fontWeight,
                lineHeight: `${height}px`,
            }}
        >
            <tspan dangerouslySetInnerHTML={{__html: text}}></tspan>
        </text>
    );
};
