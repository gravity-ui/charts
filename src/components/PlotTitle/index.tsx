import React from 'react';

import type {PreparedPlotTitle} from '../../hooks/useSplit/types';
import {block} from '../../utils';

import './styles.scss';

const b = block('plot-title');

type Props = {
    title?: PreparedPlotTitle;
};

export const PlotTitle = (props: Props) => {
    const {title} = props;

    if (!title) {
        return null;
    }

    const {x, y, text, style, height} = title;

    return (
        <text
            className={b()}
            dx={x}
            dy={y}
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
