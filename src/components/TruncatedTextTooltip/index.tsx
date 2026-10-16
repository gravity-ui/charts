import React from 'react';

import {Tooltip} from '@gravity-ui/uikit';
import type {TooltipProps} from '@gravity-ui/uikit';

import {block} from '../../utils';

import './styles.scss';

const b = block('truncated-text-tooltip');

interface Props {
    text: string;
    truncated: boolean;
    anchorRef: React.RefObject<HTMLElement | SVGElement>;
    placement?: TooltipProps['placement'];
    children: React.ReactElement<React.DOMAttributes<Element>>;
}

export function TruncatedTextTooltip({text, truncated, anchorRef, placement, children}: Props) {
    const [open, setOpen] = React.useState(false);
    const enabled = truncated && Boolean(text);

    React.useLayoutEffect(() => {
        const anchor = anchorRef.current;
        setOpen(
            enabled &&
                Boolean(anchor && (anchor === document.activeElement || anchor.matches(':hover'))),
        );
    }, [enabled, anchorRef]);

    return (
        <Tooltip
            content={text}
            open={open}
            onOpenChange={(nextOpen, _event, reason) => {
                if (
                    !nextOpen &&
                    (reason === 'hover' || reason === 'ancestor-scroll') &&
                    anchorRef.current === document.activeElement
                ) {
                    return;
                }
                setOpen(nextOpen && enabled);
            }}
            disabled={!enabled}
            openDelay={300}
            closeDelay={150}
            placement={placement}
            className={b()}
        >
            {React.cloneElement(children, {
                onFocus: (event: React.FocusEvent<Element>) => {
                    children.props.onFocus?.(event);
                    setOpen(enabled);
                },
            })}
        </Tooltip>
    );
}
