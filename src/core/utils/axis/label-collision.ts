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

export interface LabelCandidate {
    index: number;
    position: number;
    bounds: LabelBounds;
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

function getSvgLabelBounds(label: SvgLabel): LabelBounds | undefined {
    const angle = (label.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const bounds: LabelBounds = {
        left: Infinity,
        right: -Infinity,
        top: Infinity,
        bottom: -Infinity,
    };

    for (const row of label.content) {
        if (!row.text.trim()) {
            continue;
        }

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

    return Number.isFinite(bounds.left) ? bounds : undefined;
}

function getLabelBounds(tick: AxisTickWithLabel): LabelBounds | undefined {
    if (tick.svgLabel) {
        return getSvgLabelBounds(tick.svgLabel);
    }

    if (tick.htmlLabel) {
        const {x, y, size} = tick.htmlLabel;
        return {
            left: x,
            right: x + size.width,
            top: y,
            bottom: y + size.height,
        };
    }

    return undefined;
}

function overlaps(left: LabelBounds, right: LabelBounds, padding: number): boolean {
    return (
        left.left < right.right + padding &&
        left.right + padding > right.left &&
        left.top < right.bottom + padding &&
        left.bottom + padding > right.top
    );
}

export function getVisibleLabelIndexes(candidates: LabelCandidate[], padding: number): Set<number> {
    const sorted = [...candidates].sort((left, right) => left.position - right.position);
    const prioritized =
        sorted.length > 1 ? [sorted[0], sorted[sorted.length - 1], ...sorted.slice(1, -1)] : sorted;
    const selected: LabelCandidate[] = [];

    for (const candidate of prioritized) {
        if (selected.every((item) => !overlaps(item.bounds, candidate.bounds, padding))) {
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
        const bounds = getLabelBounds(tick);
        return bounds ? [{index, position: positions[index], bounds}] : [];
    });
    const visible = getVisibleLabelIndexes(candidates, padding);

    ticks.forEach((tick, index) => {
        if (!visible.has(index)) {
            tick.svgLabel = null;
            tick.htmlLabel = null;
        }
    });
}
