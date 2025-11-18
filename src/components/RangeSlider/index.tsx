import React from 'react';

import {useUniqId} from '@gravity-ui/uikit';

import {useBrush, useRangeSlider} from '../../hooks';
import type {BrushArea, RangeSliderProps} from '../../hooks';
import {block} from '../../utils';

import {getFramedPath} from './utils';

import './styles.scss';

const b = block('range-slider');

function RangeSliderComponent(props: RangeSliderProps) {
    const clipPathId = useUniqId();
    const {
        brush,
        height,
        onBrushEnd,
        onOverlayClick,
        offsetLeft,
        offsetTop,
        preparedXAxis,
        preparedYAxis,
        selection,
        shapes,
        width,
    } = useRangeSlider({...props, clipPathId});
    const ref = React.useRef<SVGGElement | null>(null);
    const areas: BrushArea[] = React.useMemo(() => {
        if (!preparedXAxis || !preparedYAxis?.length) {
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
    }, [height, preparedXAxis, preparedYAxis, width]);

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
            <defs>
                <clipPath id={clipPathId}>
                    <rect x={0} y={0} width={width} height={height} />
                </clipPath>
            </defs>
            <path
                d={getFramedPath({height, strokeWidth: 1, width})}
                fill="var(--g-color-line-generic)"
            />
            <g className={b('shapes')}>{shapes}</g>
            <rect
                height={height}
                className={b('clickable-overlay')}
                onClick={onOverlayClick}
                width={width}
                x={0}
                y={0}
            />
        </g>
    );
}

export const RangeSlider = React.memo(RangeSliderComponent);
