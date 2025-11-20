import {DEFAULT_AXIS_LABEL_FONT_SIZE} from '../../constants';
import type {AxisPlot} from '../../types';

export function prepareAxisPlotLabel(d: AxisPlot) {
    return {
        text: d.label?.text ?? '',
        style: {
            fontSize: DEFAULT_AXIS_LABEL_FONT_SIZE,
            fontColor: 'var(--g-color-text-secondary)',
            ...d.label?.style,
        },
        padding: d.label?.padding ?? 5,
    };
}
