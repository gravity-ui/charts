import React from 'react';

import type {PreparedTitle} from '../../hooks';

type Props = PreparedTitle & {
    chartWidth: number;
};

export const Title = (props: Props) => {
    const {chartWidth, text, height, style, qa} = props;

    return (
        <text
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
            data-qa={qa}
        >
            <tspan dangerouslySetInnerHTML={{__html: text}}></tspan>
        </text>
    );
};
