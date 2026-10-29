export function getSvgScreenPoint(svg: SVGSVGElement | null, x: number, y: number) {
    const matrix = svg?.getScreenCTM?.();
    if (matrix) {
        return {
            x: matrix.a * x + matrix.c * y + matrix.e,
            y: matrix.b * x + matrix.d * y + matrix.f,
        };
    }

    const rect = svg?.getBoundingClientRect();
    return {x: x + (rect?.left ?? 0), y: y + (rect?.top ?? 0)};
}
