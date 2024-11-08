import type {PreparedAxis, PreparedChart} from '../../hooks';

export const getBoundsWidth = (args: {
    chartWidth: number;
    chartMargin: PreparedChart['margin'];
    preparedYAxis: PreparedAxis[];
}) => {
    const {chartWidth, chartMargin, preparedYAxis} = args;

    return (
        chartWidth -
        chartMargin.right -
        chartMargin.left -
        getWidthOccupiedByYAxis({preparedAxis: preparedYAxis})
    );
};

export function getYAxisWidth(axis: PreparedAxis | undefined) {
    let result = 0;
    if (axis?.title.text) {
        result += axis.title.height + axis.title.margin;
    }

    if (axis?.labels.enabled) {
        result += axis.labels.margin + axis.labels.width;
    }

    return result;
}

export function getWidthOccupiedByYAxis(args: {preparedAxis: PreparedAxis[]}) {
    const {preparedAxis} = args;
    let leftAxisWidth = 0;
    let rightAxisWidth = 0;

    preparedAxis?.forEach((axis) => {
        const axisWidth = getYAxisWidth(axis);
        if (axis.position === 'right') {
            rightAxisWidth = Math.max(rightAxisWidth, axisWidth);
        } else {
            leftAxisWidth = Math.max(leftAxisWidth, axisWidth);
        }
    });

    return leftAxisWidth + rightAxisWidth;
}
