import React from 'react';

import {Tooltip} from '@gravity-ui/uikit';

import {block} from '../../utils';

import './styles.scss';

const b = block('truncated-text-tooltip');

interface Props {
    anchor: HTMLElement | SVGElement;
    text: string;
    enabled: boolean;
    vertical: boolean;
    onClose: () => void;
}

// Adapt UI Kit's render-prop anchor to a DOM node owned by the chart renderer.
function TooltipAnchor({
    anchor,
    anchorRef,
    describedBy,
}: {
    anchor: Props['anchor'];
    anchorRef: React.Ref<HTMLElement>;
    describedBy?: string;
}) {
    React.useLayoutEffect(() => {
        // UI Kit types the reference as HTML, but Floating UI also supports SVG elements.
        const element = anchor as HTMLElement;
        if (typeof anchorRef === 'function') anchorRef(element);
        else if (anchorRef)
            (anchorRef as React.MutableRefObject<HTMLElement | null>).current = element;
        return () => {
            if (typeof anchorRef === 'function') anchorRef(null);
            else if (anchorRef)
                (anchorRef as React.MutableRefObject<HTMLElement | null>).current = null;
        };
    }, [anchor, anchorRef]);
    React.useLayoutEffect(() => {
        if (describedBy) anchor.setAttribute('aria-describedby', describedBy);
        return () => {
            anchor.removeAttribute('aria-describedby');
        };
    }, [anchor, describedBy]);
    return null;
}

export function TruncatedTextTooltip({anchor, text, enabled, vertical, onClose}: Props) {
    const [open, setOpen] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout>>();
    const overContent = React.useRef(false);
    const cancelTimer = React.useCallback(() => clearTimeout(timer.current), []);
    const show = React.useCallback(() => {
        cancelTimer();
        setOpen(true);
    }, [cancelTimer]);
    const hide = React.useCallback(() => {
        cancelTimer();
        if (anchor === document.activeElement || overContent.current) return;
        timer.current = setTimeout(onClose, 150);
    }, [anchor, cancelTimer, onClose]);

    React.useLayoutEffect(() => {
        overContent.current = false;
        setOpen(false);
        const enter = () => {
            cancelTimer();
            timer.current = setTimeout(show, 300);
        };
        const blur = () => {
            if (!anchor.matches(':hover')) hide();
        };
        anchor.addEventListener('mouseenter', enter);
        anchor.addEventListener('mouseleave', hide);
        anchor.addEventListener('focus', show);
        anchor.addEventListener('blur', blur);
        if (anchor === document.activeElement) show();
        else if (anchor.matches(':hover')) enter();
        return () => {
            cancelTimer();
            anchor.removeEventListener('mouseenter', enter);
            anchor.removeEventListener('mouseleave', hide);
            anchor.removeEventListener('focus', show);
            anchor.removeEventListener('blur', blur);
        };
    }, [anchor, cancelTimer, hide, show]);

    const visible = open && enabled && Boolean(text);
    const stopEvent = (event: React.SyntheticEvent) => event.stopPropagation();
    return (
        <g
            onMouseEnter={() => {
                overContent.current = true;
                show();
            }}
            onMouseLeave={() => {
                overContent.current = false;
                hide();
            }}
            onPointerMove={stopEvent}
            onPointerLeave={stopEvent}
            onTouchStart={stopEvent}
            onTouchMove={stopEvent}
            onClick={stopEvent}
        >
            <Tooltip
                content={text}
                open={visible}
                onOpenChange={(nextOpen, _event, reason) => {
                    if (
                        !nextOpen &&
                        (reason === 'escape-key' ||
                            (reason === 'ancestor-scroll' && anchor !== document.activeElement))
                    )
                        onClose();
                }}
                trigger="focus"
                placement={vertical ? ['right', 'left'] : ['top', 'bottom']}
                className={b()}
            >
                {(props, anchorRef) => (
                    <TooltipAnchor
                        anchor={anchor}
                        anchorRef={anchorRef}
                        describedBy={visible ? (props['aria-describedby'] as string) : undefined}
                    />
                )}
            </Tooltip>
        </g>
    );
}
