import {path} from 'd3';

export function getFramedPath(args: {height: number; strokeWidth: number; width: number}) {
    const {height, strokeWidth, width} = args;

    const p = path();
    // Outer rectangle
    p.moveTo(0, 0);
    p.lineTo(width, 0);
    p.lineTo(width, height);
    p.lineTo(0, height);
    p.closePath();
    // Inner rectangle (cutout)
    p.moveTo(strokeWidth, strokeWidth);
    p.lineTo(strokeWidth, height - strokeWidth);
    p.lineTo(width - strokeWidth, height - strokeWidth);
    p.lineTo(width - strokeWidth, strokeWidth);
    p.closePath();

    return p.toString();
}
