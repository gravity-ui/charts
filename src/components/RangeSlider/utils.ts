export function getFramedPath(args: {height: number; strokeWidth: number; width: number}) {
    const {height, strokeWidth, width} = args;

    return `
        M 0 0
        L ${width} 0
        L ${width} ${height}
        L 0 ${height}
        Z
        M ${strokeWidth} ${strokeWidth}
        L ${strokeWidth} ${height - strokeWidth}
        L ${width - strokeWidth} ${height - strokeWidth}
        L ${width - strokeWidth} ${strokeWidth}
        Z
    `.replace(/[\n\s]{2,}/g, ' ');
}
