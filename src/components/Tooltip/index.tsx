import React from 'react';

import {Popup, useVirtualElementRef} from '@gravity-ui/uikit';
import type {Dispatch} from 'd3';

import type {PreparedAxis, PreparedTooltip} from '../../hooks';
import {useTooltip} from '../../hooks';
import type {ChartYAxis} from '../../types';
import {block} from '../../utils';

import {ChartTooltipContent} from './ChartTooltipContent';

import './styles.scss';

const b = block('tooltip');

type TooltipProps = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    svgContainer: SVGSVGElement | null;
    xAxis: PreparedAxis;
    yAxis: PreparedAxis;
    tooltipPinned: boolean;
    onOutsideClick?: () => void;
};

export const Tooltip = (props: TooltipProps) => {
    const {tooltip, xAxis, yAxis, svgContainer, dispatcher, tooltipPinned, onOutsideClick} = props;
    const {hovered, pointerPosition} = useTooltip({dispatcher, tooltip});
    const containerRect = svgContainer?.getBoundingClientRect() || {left: 0, top: 0};
    const left = (pointerPosition?.[0] || 0) + containerRect.left;
    const top = (pointerPosition?.[1] || 0) + containerRect.top;
    const anchorRef = useVirtualElementRef({rect: {left, top}});

    const handleOutsideClick = (e: MouseEvent) => {
        if (svgContainer?.contains(e.target as HTMLElement)) {
            return;
        }

        onOutsideClick?.();
    };

    React.useEffect(() => {
        window.dispatchEvent(new CustomEvent('scroll'));
    }, [left, top]);

    return hovered?.length ? (
        <Popup
            className={b({pinned: tooltipPinned})}
            contentClassName={b('popup-content')}
            open={true}
            anchorRef={anchorRef}
            offset={[0, 20]}
            placement={['right', 'left', 'top', 'bottom']}
            modifiers={[{name: 'preventOverflow', options: {padding: 10, altAxis: true}}]}
            onOutsideClick={tooltipPinned ? handleOutsideClick : undefined}
        >
            <div className={b('content')}>
                <ChartTooltipContent
                    hovered={hovered}
                    xAxis={xAxis}
                    yAxis={yAxis as ChartYAxis}
                    renderer={tooltip.renderer}
                />
            </div>
        </Popup>
    ) : null;
};
