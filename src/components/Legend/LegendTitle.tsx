import React from 'react';

import type {PreparedLegend} from '~core/series/types';
import {decodeHtmlEntities} from '~core/utils';

import {block} from '../../utils';
import {TruncatedTextTooltip} from '../TruncatedTextTooltip';

const b = block('legend');

interface Props {
    legend: PreparedLegend;
    restoreFocus: boolean;
}

export function LegendTitle({legend, restoreFocus}: Props) {
    const ref = React.useRef<SVGTextElement>(null);
    const {title} = legend;
    const text = decodeHtmlEntities(title.text);
    const truncated = title.resolvedText !== title.text;
    const remainingWidth = legend.resolvedWidth - title.resolvedWidth;
    let dx = 0;
    if (title.align === 'right') dx = remainingWidth;
    else if (title.align === 'center') dx = remainingWidth / 2;

    React.useLayoutEffect(() => {
        if (restoreFocus && document.activeElement === document.body) {
            ref.current?.focus({preventScroll: true});
        }
    }, [restoreFocus]);

    return (
        <TruncatedTextTooltip
            text={text}
            truncated={truncated}
            anchorRef={ref}
            placement={legend.layout === 'vertical' ? ['right', 'left'] : ['top', 'bottom']}
        >
            <text
                ref={ref}
                className={b('title-text')}
                data-legend-title=""
                role="group"
                aria-label={text}
                tabIndex={truncated ? 0 : -1}
                dx={dx}
                y={title.hangingOffset}
                fontWeight={title.style.fontWeight}
                fontSize={title.style.fontSize}
                fill={title.style.fontColor}
                style={{dominantBaseline: 'hanging'}}
                dangerouslySetInnerHTML={{__html: title.resolvedText}}
            />
        </TruncatedTextTooltip>
    );
}
