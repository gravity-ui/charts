import React from 'react';

import {Tooltip} from '@gravity-ui/uikit';
import type {Dispatch} from 'd3-dispatch';

import {useLegendTooltip} from '../../hooks/useLegendTooltip';
import {block} from '../../utils';
import type {LegendTooltipTarget} from '../Legend/tooltip-controller';

import './styles.scss';

const b = block('legend-tooltip');

// Adapt UI Kit's render-prop anchor to a DOM node owned by the chart renderer.
function TooltipAnchor({
    target,
    anchorRef,
    describedBy,
}: {
    target: LegendTooltipTarget;
    anchorRef: React.Ref<HTMLElement>;
    describedBy?: string;
}) {
    React.useLayoutEffect(() => {
        // UI Kit types the reference as HTML, but Floating UI also supports SVG elements.
        const element = target.anchor as HTMLElement;
        if (typeof anchorRef === 'function') anchorRef(element);
        else if (anchorRef)
            (anchorRef as React.MutableRefObject<HTMLElement | null>).current = element;
        return () => {
            if (typeof anchorRef === 'function') anchorRef(null);
            else if (anchorRef)
                (anchorRef as React.MutableRefObject<HTMLElement | null>).current = null;
        };
    }, [target.anchor, anchorRef]);
    React.useLayoutEffect(() => {
        target.onDescribe(describedBy);
        return () => target.onDescribe();
    }, [target, describedBy]);
    return null;
}

function TooltipContent({target}: {target: LegendTooltipTarget}) {
    const ref = React.useRef<HTMLSpanElement>(null);
    React.useLayoutEffect(() => {
        // Listen on the popup so its padding also keeps the tooltip open.
        const popup = ref.current?.closest('[role="tooltip"]');
        const enter = () => target.onContentHover(true);
        const leave = () => target.onContentHover(false);
        popup?.addEventListener('mouseenter', enter);
        popup?.addEventListener('mouseleave', leave);
        return () => {
            popup?.removeEventListener('mouseenter', enter);
            popup?.removeEventListener('mouseleave', leave);
        };
    }, [target]);
    return <span ref={ref}>{target.text}</span>;
}

export function LegendTooltip({dispatcher}: {dispatcher: Dispatch<object>}) {
    const target = useLegendTooltip(dispatcher);
    if (!target) return null;
    return (
        <Tooltip
            content={<TooltipContent target={target} />}
            open
            onOpenChange={(open, _event, reason) => {
                if (!open) target.onDismiss(reason);
            }}
            trigger="focus"
            placement={target.vertical ? ['right', 'left'] : ['top', 'bottom']}
            className={b()}
        >
            {(props, anchorRef) => (
                <TooltipAnchor
                    target={target}
                    anchorRef={anchorRef}
                    describedBy={props['aria-describedby'] as string | undefined}
                />
            )}
        </Tooltip>
    );
}
