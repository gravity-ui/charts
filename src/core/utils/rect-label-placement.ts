export type RectLabelPosition = 'outside' | 'inside-end' | 'inside-center';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RectLabelPlacementArgs {
    anchor: Rect;
    bounds: Rect;
    size: {width: number; height: number};
    /** Axis along which candidate positions are placed. */
    axis: 'x' | 'y';
    /** Whether the reference end is at the larger coordinate along the axis. */
    endAtMax: boolean;
    padding: number;
    positions: readonly RectLabelPosition[];
    /** Whether outside candidates are available for this rectangle. */
    allowOutside?: boolean;
    fallback?: 'show' | 'hide';
}

function contains(outer: Rect, inner: Rect) {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

/** Place a label box relative to a rectangle, returning its top-left coordinates. */
export function placeRectLabel(args: RectLabelPlacementArgs): {x: number; y: number} | undefined {
    const {anchor, bounds, size, axis, endAtMax, padding, positions, fallback} = args;
    const horizontal = axis === 'x';
    const visible: Rect = {
        x: Math.max(anchor.x, bounds.x),
        y: Math.max(anchor.y, bounds.y),
        width: 0,
        height: 0,
    };
    visible.width = Math.max(
        0,
        Math.min(anchor.x + anchor.width, bounds.x + bounds.width) - visible.x,
    );
    visible.height = Math.max(
        0,
        Math.min(anchor.y + anchor.height, bounds.y + bounds.height) - visible.y,
    );
    const visibleStart = horizontal ? visible.x : visible.y;
    const visibleSize = horizontal ? visible.width : visible.height;
    const labelSize = horizontal ? size.width : size.height;
    const anchorStart = horizontal ? anchor.x : anchor.y;
    const anchorSize = horizontal ? anchor.width : anchor.height;
    let first: Rect | undefined;

    for (const position of positions) {
        if (position === 'outside' && args.allowOutside === false) continue;
        let along: number;
        if (position === 'outside') {
            along = endAtMax
                ? anchorStart + anchorSize + padding
                : anchorStart - padding - labelSize;
        } else if (position === 'inside-end') {
            along = endAtMax
                ? visibleStart + visibleSize - padding - labelSize
                : visibleStart + padding;
        } else {
            along = visibleStart + (visibleSize - labelSize) / 2;
        }
        const candidate: Rect = {
            ...size,
            x: horizontal ? along : visible.x + (visible.width - size.width) / 2,
            y: horizontal ? visible.y + (visible.height - size.height) / 2 : along,
        };
        first ??= candidate;
        const insideFits =
            position === 'outside' ||
            (contains(visible, candidate) &&
                along >= visibleStart + padding &&
                along + labelSize <= visibleStart + visibleSize - padding);
        if (anchor.width >= 0 && anchor.height >= 0 && contains(bounds, candidate) && insideFits) {
            return {x: candidate.x, y: candidate.y};
        }
    }

    if (fallback === 'hide' || !first) return undefined;
    return {
        x: Math.max(bounds.x, Math.min(first.x, bounds.x + Math.max(0, bounds.width - size.width))),
        y: Math.max(
            bounds.y,
            Math.min(first.y, bounds.y + Math.max(0, bounds.height - size.height)),
        ),
    };
}
