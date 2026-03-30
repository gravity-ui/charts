import React from 'react';

import type {PreparedTitle} from '../../hooks';

type Props = PreparedTitle & {
    chartWidth: number;
};

export const Title = (props: Props) => {
    const {chartWidth, style, qa, contentRows} = props;

    return (
        <text
            dominantBaseline="hanging"
            textAnchor="middle"
            style={{
                fill: style?.fontColor,
                fontSize: style?.fontSize,
                fontWeight: style?.fontWeight,
            }}
            data-qa={qa}
        >
            {contentRows.map((row, i) => (
                <tspan
                    key={i}
                    x={chartWidth / 2}
                    y={row.y}
                    dominantBaseline="hanging"
                    dangerouslySetInnerHTML={{__html: row.text}}
                />
            ))}
        </text>
    );
};
