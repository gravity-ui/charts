import type {BaseType, Selection} from 'd3-selection';
import {select} from 'd3-selection';

import {block} from '../../utils';
import type {AnnotationAnchor} from '../series/types';
import {DESCENDER_RATIO} from '../utils/text';

const b = block('annotation');

const ARROW_WIDTH = 18;
const ARROW_HEIGHT = 9;

type Placement = 'top' | 'bottom' | 'right' | 'left';

type PopupLayout = {
    arrowX: number;
    arrowY: number;
    placement: Placement;
    popupX: number;
    popupY: number;
    showArrow: boolean;
};

// Base arrow path pointing downward (for "top" placement).
// Elliptical arc matching gravity-ui/uikit Popup arrow geometry.
// uikit builds the arrow from two 28×30 circles ($arrow-circle-width/height) with
// a 5px inset box-shadow ($arrow-border), clipped in 9×9 wrappers.
// The visible curve follows the inner edge of the ring:
// rx = circle_width/2 - (arrow_border - border_width) = 14 - 4 = 10
// ry = circle_height/2 - (arrow_border - border_width) = 15 - 4 = 11
const ARROW_RX = 10;
const ARROW_RY = 11;
const ARROW_PATH = (() => {
    const hw = ARROW_WIDTH / 2;
    const h = ARROW_HEIGHT;
    return `M ${-hw},0 A ${ARROW_RX} ${ARROW_RY} 0 0 1 0,${h} A ${ARROW_RX} ${ARROW_RY} 0 0 1 ${hw},0 Z`;
})();

function getArrowRotation(placement: Placement): number {
    switch (placement) {
        case 'top':
            return 0;
        case 'bottom':
            return 180;
        case 'right':
            return 90;
        case 'left':
        default:
            return -90;
    }
}

function clampX(x: number, width: number, plotWidth: number): number {
    return Math.max(0, Math.min(x, plotWidth - width));
}

function clampY(y: number, height: number, plotHeight: number): number {
    return Math.max(0, Math.min(y, plotHeight - height));
}

function calculateLayout(args: {
    anchorX: number;
    anchorY: number;
    offset: number;
    plotHeight: number;
    plotWidth: number;
    popupHeight: number;
    popupWidth: number;
}): PopupLayout {
    const {anchorX, anchorY, popupWidth, popupHeight, offset, plotWidth, plotHeight} = args;
    // Minimum distance from popup edge to arrow center (arrow half-width + border radius clearance)
    const arrowEdgePadding = ARROW_WIDTH / 2;

    // Check if anchor falls within popup's horizontal span (for top/bottom placement)
    function isAnchorInPopupX(popupX: number) {
        return (
            anchorX >= popupX + arrowEdgePadding &&
            anchorX <= popupX + popupWidth - arrowEdgePadding
        );
    }

    // Check if anchor falls within popup's vertical span (for right/left placement)
    function isAnchorInPopupY(popupY: number) {
        return (
            anchorY >= popupY + arrowEdgePadding &&
            anchorY <= popupY + popupHeight - arrowEdgePadding
        );
    }

    // Try top
    const topY = anchorY - offset - ARROW_HEIGHT - popupHeight;
    if (topY >= 0) {
        const popupX = clampX(anchorX - popupWidth / 2, popupWidth, plotWidth);
        if (isAnchorInPopupX(popupX)) {
            return {
                arrowX: anchorX,
                arrowY: anchorY,
                popupX,
                popupY: topY,
                placement: 'top',
                showArrow: true,
            };
        }
    }

    // Try bottom
    const bottomY = anchorY + offset + ARROW_HEIGHT;
    if (bottomY + popupHeight <= plotHeight) {
        const popupX = clampX(anchorX - popupWidth / 2, popupWidth, plotWidth);
        if (isAnchorInPopupX(popupX)) {
            return {
                arrowX: anchorX,
                arrowY: anchorY,
                popupX,
                popupY: bottomY,
                placement: 'bottom',
                showArrow: true,
            };
        }
    }

    // Try right
    const rightX = anchorX + offset + ARROW_HEIGHT;
    if (rightX + popupWidth <= plotWidth) {
        const popupY = clampY(anchorY - popupHeight / 2, popupHeight, plotHeight);
        if (isAnchorInPopupY(popupY)) {
            return {
                arrowX: anchorX,
                arrowY: anchorY,
                popupX: rightX,
                popupY,
                placement: 'right',
                showArrow: true,
            };
        }
    }

    // Try left
    const leftX = anchorX - offset - ARROW_HEIGHT - popupWidth;
    if (leftX >= 0) {
        const popupY = clampY(anchorY - popupHeight / 2, popupHeight, plotHeight);
        if (isAnchorInPopupY(popupY)) {
            return {
                arrowX: anchorX,
                arrowY: anchorY,
                popupX: leftX,
                popupY,
                placement: 'left',
                showArrow: true,
            };
        }
    }

    // Fallback: no arrow, popup near anchor (prefer above, then below)
    const popupX = clampX(anchorX - popupWidth / 2, popupWidth, plotWidth);
    const fallbackTopY = anchorY - offset - popupHeight;
    const popupY =
        fallbackTopY >= 0 ? fallbackTopY : Math.min(plotHeight - popupHeight, anchorY + offset);
    return {
        arrowX: anchorX,
        arrowY: anchorY,
        popupX,
        popupY,
        placement: 'top',
        showArrow: false,
    };
}

function getArrowTranslate(layout: PopupLayout, popupWidth: number, popupHeight: number): string {
    const {arrowX, arrowY, popupX, popupY, placement} = layout;

    // Overlap by 0.5px to avoid subpixel gap between arrow and popup rect
    const overlap = 0.5;

    switch (placement) {
        case 'top':
            return `translate(${arrowX}, ${popupY + popupHeight - overlap})`;
        case 'bottom':
            return `translate(${arrowX}, ${popupY + overlap})`;
        case 'right':
            return `translate(${popupX + overlap}, ${arrowY})`;
        case 'left':
        default:
            return `translate(${popupX + popupWidth - overlap}, ${arrowY})`;
    }
}

export function renderAnnotations(args: {
    anchors: AnnotationAnchor[];
    container: Selection<SVGGElement, unknown, null, undefined>;
    plotHeight: number;
    plotWidth: number;
}) {
    const {container, anchors, plotWidth, plotHeight} = args;

    container.selectAll(`.${b()}`).remove();

    if (!anchors.length) {
        return;
    }

    const groups = container
        .selectAll<BaseType, AnnotationAnchor>(`.${b()}`)
        .data(anchors)
        .join('g')
        .attr('class', b());

    groups.each(function (d) {
        const g = select(this as SVGGElement);
        const {annotation, x: anchorX, y: anchorY} = d;
        const {label, popup} = annotation;
        const [paddingV, paddingH] = popup.padding;

        const popupWidth = label.size.width + paddingH * 2;
        const popupHeight = label.size.height + paddingV * 2;

        const layout = calculateLayout({
            anchorX,
            anchorY,
            popupWidth,
            popupHeight,
            offset: popup.offset,
            plotWidth,
            plotHeight,
        });

        // Popup background
        g.append('rect')
            .attr('class', b('popup'))
            .attr('x', layout.popupX)
            .attr('y', layout.popupY)
            .attr('width', popupWidth)
            .attr('height', popupHeight)
            .attr('rx', popup.borderRadius)
            .attr('ry', popup.borderRadius)
            .attr('fill', popup.backgroundColor);

        // Arrow
        if (layout.showArrow) {
            const arrowTranslate = getArrowTranslate(layout, popupWidth, popupHeight);
            const arrowRotation = getArrowRotation(layout.placement);
            g.append('path')
                .attr('class', b('arrow'))
                .attr('d', ARROW_PATH)
                .attr('fill', popup.backgroundColor)
                .attr('transform', `${arrowTranslate} rotate(${arrowRotation})`);
        }

        // Text
        g.append('text')
            .attr('class', b('text'))
            .text(label.text)
            .attr('x', layout.popupX + paddingH)
            .attr('y', layout.popupY + paddingV + label.size.height * (1 - DESCENDER_RATIO))
            .style('font-size', label.style.fontSize)
            .style('font-weight', label.style.fontWeight || '')
            .style('fill', label.style.fontColor || '');
    });
}
