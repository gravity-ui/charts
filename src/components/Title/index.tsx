import React from 'react';

import type {PreparedTitle} from '../../hooks';

type Props = PreparedTitle & {
    chartWidth: number;
};

export const Title = (props: Props) => {
    const {chartWidth, height, style, qa, contentRows} = props;

    const totalTextHeight = contentRows.reduce((acc, row) => acc + row.size.height, 0);
    const topOffset = (height - totalTextHeight) / 2;

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
                    y={topOffset + row.y}
                    dominantBaseline="hanging"
                    dangerouslySetInnerHTML={{__html: row.text}}
                />
            ))}
        </text>
    );
};
