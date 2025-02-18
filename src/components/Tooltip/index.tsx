import React from 'react';

import {Popup, useVirtualElement} from '@gravity-ui/uikit';
import type {PopupProps} from '@gravity-ui/uikit';
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
    const {anchor} = useVirtualElement({left, top});

    const handleOnOpenChange: PopupProps['onOpenChange'] = (_open: boolean, e) => {
        if (svgContainer?.contains(e?.target as HTMLElement)) {
            return;
        }

        onOutsideClick?.();
    };

    React.useEffect(() => {
        window.dispatchEvent(new CustomEvent('scroll'));
    }, [left, top]);
    return hovered?.length ? (
        <Popup
            anchorElement={anchor}
            className={b({pinned: tooltipPinned})}
            disableTransition={true}
            floatingStyles={tooltipPinned ? undefined : {pointerEvents: 'none'}}
            offset={{mainAxis: 20}}
            onOpenChange={tooltipPinned ? handleOnOpenChange : undefined}
            open={true}
            placement={['right', 'left', 'top', 'bottom']}
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
