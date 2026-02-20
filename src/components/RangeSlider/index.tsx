import React from 'react';

import {useUniqId} from '@gravity-ui/uikit';

import {useBrush, useRangeSlider} from '../../hooks';
import type {BrushArea, RangeSliderProps} from '../../hooks';
import {block, isBandScale} from '../../utils';
import {getInitialRangeSliderState} from '../utils';

import {getFramedPath} from './utils';

import './styles.scss';

const b = block('range-slider');

export interface RangeSliderHandle {
    resetState: () => void;
}

function RangeSliderComponent(props: RangeSliderProps, forwardedRef: React.Ref<RangeSliderHandle>) {
    const {onUpdate} = props;
    const clipPathId = useUniqId();
    const {
        brush,
        defaultRange,
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
        xScale,
    } = useRangeSlider({...props, clipPathId});
    const ref = React.useRef<SVGGElement | null>(null);

    /*
     * We use useImperativeHandle to expose methods to the parent component.
     *
     * This is necessary due to an architectural decision: all calculations for all data series
     * (without zoom) are performed only within the RangeSlider component. This approach
     * was chosen to avoid degrading performance for charts that don't use the slider —
     * in that case, the extra computations simply don't happen.
     *
     * Methods:
     * - resetState: resets the slider state to its initial value (these calculations
     *   are only possible within the component since it has access to the prepared series data)
     */
    React.useImperativeHandle(
        forwardedRef,
        () => ({
            resetState: () => {
                if (xScale && !isBandScale(xScale)) {
                    const initialRangeSliderState = getInitialRangeSliderState({
                        xScale,
                        defaultRange,
                    });
                    onUpdate(initialRangeSliderState);
                }
            },
        }),
        [defaultRange, onUpdate, xScale],
    );
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
        preventNullSelection: true,
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

export const RangeSlider = React.memo(
    React.forwardRef<RangeSliderHandle, RangeSliderProps>(RangeSliderComponent),
);
