import type {HtmlItem} from '../../../types';

interface LabelRow {
    text: string;
    x: number;
    y: number;
    size: {width: number; height: number};
}

interface LabelBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface LabelRectangle {
    centerX: number;
    centerY: number;
    halfWidth: number;
    halfHeight: number;
    cos: number;
    sin: number;
}

export interface LabelCandidate {
    index: number;
    position: number;
    bounds: LabelBounds;
    rectangles?: LabelRectangle[];
}

interface PreparedLabelCandidate extends LabelCandidate {
    rectangles: LabelRectangle[];
    useRowBounds: boolean;
}

interface SvgLabel {
    x: number;
    y: number;
    angle: number;
    content: LabelRow[];
}

interface AxisTickWithLabel {
    svgLabel: SvgLabel | null;
    htmlLabel: HtmlItem | null;
}

export function getSvgLabelCandidate(
    label: SvgLabel,
    index: number,
    position: number,
): LabelCandidate | undefined {
    const angle = (label.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const bounds: LabelBounds = {
        left: Infinity,
        right: -Infinity,
        top: Infinity,
        bottom: -Infinity,
    };
    const rectangles: LabelRectangle[] = [];

    for (const row of label.content) {
        if (!row.text.trim()) {
            continue;
        }

        const centerX = row.x + row.size.width / 2;
        const centerY = row.y + row.size.height / 2;
        rectangles.push({
            centerX: label.x + centerX * cos - centerY * sin,
            centerY: label.y + centerX * sin + centerY * cos,
            halfWidth: Math.abs(row.size.width) / 2,
            halfHeight: Math.abs(row.size.height) / 2,
            cos,
            sin,
        });

        for (const x of [row.x, row.x + row.size.width]) {
            for (const y of [row.y, row.y + row.size.height]) {
                const rotatedX = label.x + x * cos - y * sin;
                const rotatedY = label.y + x * sin + y * cos;
                bounds.left = Math.min(bounds.left, rotatedX);
                bounds.right = Math.max(bounds.right, rotatedX);
                bounds.top = Math.min(bounds.top, rotatedY);
                bounds.bottom = Math.max(bounds.bottom, rotatedY);
            }
        }
    }

    return Number.isFinite(bounds.left)
        ? {
              index,
              position,
              bounds,
              rectangles: label.angle % 180 === 0 ? undefined : rectangles,
          }
        : undefined;
}

function getLabelCandidate(
    tick: AxisTickWithLabel,
    index: number,
    position: number,
): LabelCandidate | undefined {
    if (tick.svgLabel) {
        return getSvgLabelCandidate(tick.svgLabel, index, position);
    }

    if (tick.htmlLabel) {
        const {x, y, size} = tick.htmlLabel;
        return {
            index,
            position,
            bounds: {
                left: x,
                right: x + size.width,
                top: y,
                bottom: y + size.height,
            },
        };
    }

    return undefined;
}

function getBoundsRectangle(bounds: LabelBounds): LabelRectangle {
    return {
        centerX: (bounds.left + bounds.right) / 2,
        centerY: (bounds.top + bounds.bottom) / 2,
        halfWidth: (bounds.right - bounds.left) / 2,
        halfHeight: (bounds.bottom - bounds.top) / 2,
        cos: 1,
        sin: 0,
    };
}

function overlapsBounds(left: LabelBounds, right: LabelBounds, padding: number): boolean {
    return (
        left.left < right.right + padding &&
        left.right + padding > right.left &&
        left.top < right.bottom + padding &&
        left.bottom + padding > right.top
    );
}

function getProjectedRadius(rectangle: LabelRectangle, x: number, y: number): number {
    return (
        rectangle.halfWidth * Math.abs(rectangle.cos * x + rectangle.sin * y) +
        rectangle.halfHeight * Math.abs(-rectangle.sin * x + rectangle.cos * y)
    );
}

function overlapsRectangles(left: LabelRectangle, right: LabelRectangle, padding: number): boolean {
    const axes = [
        [left.cos, left.sin],
        [-left.sin, left.cos],
        [right.cos, right.sin],
        [-right.sin, right.cos],
    ];
    const centerX = right.centerX - left.centerX;
    const centerY = right.centerY - left.centerY;

    return axes.every(([x, y]) => {
        const distance = Math.abs(centerX * x + centerY * y);
        const extent = getProjectedRadius(left, x, y) + getProjectedRadius(right, x, y);
        return distance < extent + padding;
    });
}

function overlaps(
    left: PreparedLabelCandidate,
    right: PreparedLabelCandidate,
    padding: number,
): boolean {
    if (!overlapsBounds(left.bounds, right.bounds, padding)) {
        return false;
    }

    if (!left.useRowBounds && !right.useRowBounds) {
        return true;
    }

    return left.rectangles.some((leftRectangle) =>
        right.rectangles.some((rightRectangle) =>
            overlapsRectangles(leftRectangle, rightRectangle, padding),
        ),
    );
}

export function getVisibleLabelIndexes(candidates: LabelCandidate[], padding: number): Set<number> {
    const sorted = candidates
        .map((candidate) => ({
            ...candidate,
            rectangles: candidate.rectangles ?? [getBoundsRectangle(candidate.bounds)],
            useRowBounds: candidate.rectangles !== undefined,
        }))
        .sort((left, right) => left.position - right.position);
    const prioritized =
        sorted.length > 1 ? [sorted[0], sorted[sorted.length - 1], ...sorted.slice(1, -1)] : sorted;
    const selected: PreparedLabelCandidate[] = [];

    for (const candidate of prioritized) {
        if (selected.every((item) => !overlaps(item, candidate, padding))) {
            selected.push(candidate);
        }
    }

    return new Set(selected.map((item) => item.index));
}

export function hideOverlappingTickLabels<T extends AxisTickWithLabel>(
    ticks: T[],
    positions: number[],
    padding: number,
): void {
    const candidates = ticks.flatMap((tick, index) => {
        const candidate = getLabelCandidate(tick, index, positions[index]);
        return candidate ? [candidate] : [];
    });
    const visible = getVisibleLabelIndexes(candidates, padding);

    ticks.forEach((tick, index) => {
        if (!visible.has(index)) {
            tick.svgLabel = null;
            tick.htmlLabel = null;
        }
    });
}
