import React from 'react';

import {Popup, useVirtualElementRef} from '@gravity-ui/uikit';
import type {Dispatch} from 'd3';
import isNil from 'lodash/isNil';

import type {PreparedAxis, PreparedTooltip} from '../../hooks';
import {useTooltip} from '../../hooks';
import {block} from '../../utils';

import {DefaultContent} from './DefaultContent';

import './styles.scss';

const b = block('d3-tooltip');

type TooltipProps = {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    svgContainer: SVGSVGElement | null;
    xAxis: PreparedAxis;
    yAxis: PreparedAxis;
};

export const Tooltip = (props: TooltipProps) => {
    const {tooltip, xAxis, yAxis, svgContainer, dispatcher} = props;
    const {hovered, pointerPosition} = useTooltip({dispatcher, tooltip});
    const containerRect = svgContainer?.getBoundingClientRect() || {left: 0, top: 0};
    const left = (pointerPosition?.[0] || 0) + containerRect.left;
    const top = (pointerPosition?.[1] || 0) + containerRect.top;
    const anchorRef = useVirtualElementRef({rect: {top, left}});
    const content = React.useMemo(() => {
        if (!hovered) {
            return null;
        }

        const customTooltip = tooltip.renderer?.({hovered});
        return isNil(customTooltip) ? (
            <DefaultContent hovered={hovered} xAxis={xAxis} yAxis={yAxis} />
        ) : (
            customTooltip
        );
    }, [hovered, tooltip, xAxis, yAxis]);

    React.useEffect(() => {
        window.dispatchEvent(new CustomEvent('scroll'));
    }, [left, top]);

    return hovered?.length ? (
        <Popup
            className={b()}
            open={true}
            anchorRef={anchorRef}
            offset={[0, 20]}
            placement={['right', 'left', 'top', 'bottom']}
            modifiers={[{name: 'preventOverflow', options: {padding: 10, altAxis: true}}]}
        >
            <div className={b('content')}>{content}</div>
        </Popup>
    ) : null;
};
