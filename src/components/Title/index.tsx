import React from 'react';

import type {PreparedTitle} from '../../hooks';
import {HtmlLayer} from '../../hooks/useShapes/HtmlLayer';

type Props = PreparedTitle & {
    htmlLayout?: HTMLElement | null;
};

export const Title = (props: Props) => {
    const {style, qa, contentRows, html, htmlElements, htmlLayout} = props;

    if (html) {
        if (!htmlLayout || !htmlElements) {
            return null;
        }

        return <HtmlLayer htmlLayout={htmlLayout} preparedData={{htmlElements}} />;
    }

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
            {contentRows?.map((row, i) => (
                <tspan
                    key={i}
                    x={row.x}
                    y={row.y}
                    dominantBaseline="hanging"
                    dangerouslySetInnerHTML={{__html: row.text}}
                />
            ))}
        </text>
    );
};
