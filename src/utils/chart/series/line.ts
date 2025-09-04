import type {TDashStyle} from 'src/constants';

export function getLineDashArray(dashStyle: TDashStyle, strokeWidth = 2) {
    const value = dashStyle.toLowerCase();

    const arrayValue = value
        .replace('shortdashdotdot', '3,1,1,1,1,1,')
        .replace('shortdashdot', '3,1,1,1')
        .replace('shortdot', '1,1,')
        .replace('shortdash', '3,1,')
        .replace('longdash', '8,3,')
        .replace(/dot/g, '1,3,')
        .replace('dash', '4,3,')
        .replace(/,$/, '')
        .split(',')
        .map((part) => {
            return `${parseInt(part, 10) * strokeWidth}`;
        });

    return arrayValue.join(',').replace(/NaN/g, 'none');
}
