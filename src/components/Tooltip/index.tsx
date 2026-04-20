import React from 'react';

import {Popup, useVirtualElement} from '@gravity-ui/uikit';
import type {PopupProps} from '@gravity-ui/uikit';
import type {Dispatch} from 'd3-dispatch';

import type {PreparedTooltip, PreparedXAxis, PreparedYAxis} from '../../hooks';
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
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis;
    tooltipPinned: boolean;
    onOutsideClick?: () => void;
};

export const Tooltip = (props: TooltipProps) => {
    const {tooltip, xAxis, yAxis, svgContainer, dispatcher, tooltipPinned, onOutsideClick} = props;
    const {hovered, hoveredPlotBands, hoveredPlotLines, hoveredPlotShapes, pointerPosition} =
        useTooltip({
            dispatcher,
            tooltip,
            xAxis,
            yAxis,
        });
    const containerRectRef = React.useRef<{left: number; top: number}>({left: 0, top: 0});

    React.useEffect(() => {
        if (!svgContainer) return undefined;

        const updateRect = (e?: Event) => {
            // Skip the synthetic CustomEvent('scroll') dispatched below to reposition the Popup.
            // All other events — including transitionend and animationend — should update the rect.
            if (e instanceof CustomEvent) return;
            containerRectRef.current = svgContainer.getBoundingClientRect();
        };

        updateRect();

        const resizeObserver = new ResizeObserver(() => updateRect());
        resizeObserver.observe(svgContainer);

        window.addEventListener('scroll', updateRect, {passive: true, capture: true});
        window.addEventListener('transitionend', updateRect, {capture: true});
        window.addEventListener('animationend', updateRect, {capture: true});

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('scroll', updateRect, {capture: true});
            window.removeEventListener('transitionend', updateRect, {capture: true});
            window.removeEventListener('animationend', updateRect, {capture: true});
        };
    }, [svgContainer]);

    const containerRect = containerRectRef.current;
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
            <div className={b('popup-content')}>
                <ChartTooltipContent
                    hovered={hovered}
                    hoveredPlotBands={hoveredPlotBands}
                    hoveredPlotLines={hoveredPlotLines}
                    hoveredPlotShapes={hoveredPlotShapes}
                    pinned={tooltipPinned}
                    renderer={tooltip.renderer}
                    rowRenderer={tooltip.rowRenderer}
                    totals={tooltip.totals}
                    valueFormat={tooltip.valueFormat}
                    headerFormat={tooltip.headerFormat}
                    xAxis={xAxis}
                    yAxis={yAxis as ChartYAxis}
                    qa={tooltip.qa}
                />
            </div>
        </Popup>
    ) : null;
};
