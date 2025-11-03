import React from 'react';

import {useBrush} from '../../hooks/useBrush';
import type {BrushArea} from '../../hooks/useBrush/types';
import {block} from '../../utils';

import type {RangeSliderProps} from './types';
import {useRangeSliderProps} from './useRangeSliderProps';
import {getFramedPath} from './utils';

import './styles.scss';

const b = block('range-slider');

function RangeSliderComponent(props: RangeSliderProps) {
    const {brush, height, onBrushEnd, offsetLeft, offsetTop, selection, shapes, width} =
        useRangeSliderProps(props);
    const ref = React.useRef<SVGGElement | null>(null);
    const areas: BrushArea[] = React.useMemo(() => {
        if (!props.xAxis || !props.yAxis?.length) {
            return [];
        }
        return [
            {
                extent: [
                    [0, 0],
                    [width, height],
                ],
            },
        ];
    }, [height, props.xAxis, props.yAxis, width]);

    useBrush({
        areas,
        brushOptions: brush,
        node: ref.current,
        onBrushEnd,
        selection,
        type: 'x',
    });

    return (
        <g
            className={b()}
            transform={`translate(${offsetLeft}, ${offsetTop})`}
            width={width}
            height={height}
            ref={ref}
        >
            <path
                d={getFramedPath({height, strokeWidth: 1, width})}
                fill="var(--g-color-line-generic)"
            />
            <g opacity={0.5}>{shapes}</g>
        </g>
    );
}

export const RangeSlider = React.memo(RangeSliderComponent);
