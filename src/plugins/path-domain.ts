import type {AxisDomainValue, DomainViewport} from '~core/series/plugin';

interface Point {
    x: number;
    y: number;
}

interface Args {
    points: readonly {x?: AxisDomainValue; y?: AxisDomainValue}[];
    viewport: DomainViewport;
    step?: 'before' | 'middle' | 'after';
}

/** Visible Y values of a linear or stepped path, including intersections at the X edges. */
export function getVisiblePathYValues({
    points,
    viewport,
    step,
}: Args): AxisDomainValue[] | undefined {
    if (!viewport.x.range || viewport.x.type === 'category' || viewport.y.type === 'category') {
        return undefined;
    }
    const projectX =
        viewport.x.type === 'logarithmic' ? (x: number) => Math.log(x) : (x: number) => x;
    const projectY =
        viewport.y.type === 'logarithmic' ? (y: number) => Math.log(y) : (y: number) => y;
    const invertY =
        viewport.y.type === 'logarithmic' ? (y: number) => Math.exp(y) : (y: number) => y;
    const min = projectX(viewport.x.range[0]);
    const max = projectX(viewport.x.range[1]);
    const values: AxisDomainValue[] = [];
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return values;

    const append = (y: number) => values.push(invertY(y));
    const appendSegment = (from: Point, to: Point) => {
        if (Math.max(from.x, to.x) < min || Math.min(from.x, to.x) > max) return;
        if (from.x === to.x) {
            append(from.y);
            append(to.y);
            return;
        }
        const a = (min - from.x) / (to.x - from.x);
        const b = (max - from.x) / (to.x - from.x);
        const start = Math.max(0, Math.min(a, b));
        const end = Math.min(1, Math.max(a, b));
        for (const t of [start, end]) append(from.y + t * (to.y - from.y));
    };

    let previous: Point | undefined;
    for (const point of points) {
        const x = point.x === null || point.x === undefined ? NaN : projectX(Number(point.x));
        const y = point.y === null || point.y === undefined ? NaN : projectY(Number(point.y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            previous = undefined;
            continue;
        }
        const current = {x, y};
        if (x >= min && x <= max) values.push(point.y);
        if (previous) {
            if (step) {
                let transitionX = x;
                if (step === 'middle') transitionX = (previous.x + x) / 2;
                else if (step === 'before') transitionX = previous.x;
                const before = {x: transitionX, y: previous.y};
                const after = {x: transitionX, y};
                appendSegment(previous, before);
                appendSegment(before, after);
                appendSegment(after, current);
            } else {
                appendSegment(previous, current);
            }
        }
        previous = current;
    }
    return values;
}
