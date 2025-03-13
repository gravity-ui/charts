import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedBoxplotSeries, PreparedSeriesOptions} from '../../useSeries/types';
import type {PreparedBoxplotData} from '../boxplot/types';

interface PrepareBoxplotDataArgs {
    series: PreparedBoxplotSeries[];
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
}

export function prepareBoxplotData(args: PrepareBoxplotDataArgs): PreparedBoxplotData[] {
    const {series, seriesOptions, xScale, yScale} = args;

    return series.reduce<PreparedBoxplotData[]>((acc, singleSeries) => {
        const {
            data,
            id,
            name,
            color,
            visible,
            boxWidth,
            whiskerWidth,
            showOutliers,
            outlierRadius,
            yAxis: yAxisIndex = 0,
        } = singleSeries;

        if (!visible) {
            return acc;
        }

        const currentYScale = yScale[yAxisIndex];

        // Get the maximum width for a box
        const boxMaxWidth = seriesOptions.boxplot?.boxMaxWidth ?? 50;

        // Calculate the width of each box
        // Use a reasonable default width for the box
        const categoryWidth = Math.min(
            boxMaxWidth,
            'bandwidth' in xScale ? xScale.bandwidth() * 0.7 : 20, // Reduce bandwidth to 70% to add more padding
        );

        // Apply the boxWidth percentage to the category width
        const actualBoxWidth = categoryWidth * boxWidth;

        // Calculate the whisker width based on the box width
        // In Highcharts, whiskers are typically narrower than the box
        const actualWhiskerWidth = actualBoxWidth * whiskerWidth;

        const preparedData: PreparedBoxplotData[] = [];

        data.forEach((point) => {
            const {x, low, q1, median, q3, high, outliers = [], custom, color: pointColor} = point;

            if (x === undefined) {
                return; // Skip points without x value
            }

            // Get the x position (center of the box)
            let xPosition: number | undefined;
            if ('bandwidth' in xScale) {
                // For category scales (scaleBand), get the center of the band
                const bandPosition = xScale(x as any);
                if (bandPosition !== undefined) {
                    // Center the box in the band
                    xPosition = bandPosition + xScale.bandwidth() / 2;
                }
            } else {
                // For continuous scales
                xPosition = xScale(x as any);
            }

            // Calculate y positions for the box and whiskers
            // Note: In SVG, y=0 is at the top and increases downward
            // But our boxplot data has low values at the bottom and high values at the top
            const yLow = currentYScale(low as any);
            const yQ1 = currentYScale(q1 as any);
            const yMedian = currentYScale(median as any);
            const yQ3 = currentYScale(q3 as any);
            const yHigh = currentYScale(high as any);

            if (yQ1 === undefined || yQ3 === undefined || xPosition === undefined) {
                return; // Skip points with undefined values
            }

            // Calculate the box dimensions
            // In SVG, y increases downward, so yQ3 (third quartile) will be a smaller value than yQ1 (first quartile)
            // We need to take the absolute value to ensure positive height
            const boxHeight = Math.abs(yQ3 - yQ1);

            // Calculate the positions for the whiskers
            const whiskerTop = {
                x1: xPosition - actualWhiskerWidth / 2,
                y1: yHigh!,
                x2: xPosition + actualWhiskerWidth / 2,
                y2: yHigh!,
            };

            const whiskerBottom = {
                x1: xPosition - actualWhiskerWidth / 2,
                y1: yLow!,
                x2: xPosition + actualWhiskerWidth / 2,
                y2: yLow!,
            };

            // Calculate the positions for the vertical lines
            const verticalLineTop = {
                x1: xPosition,
                y1: yHigh!,
                x2: xPosition,
                y2: yQ3,
            };

            const verticalLineBottom = {
                x1: xPosition,
                y1: yQ1,
                x2: xPosition,
                y2: yLow!,
            };

            // Prepare outlier points if enabled
            const outlierPoints = showOutliers
                ? outliers.map((value) => ({
                      x: xPosition,
                      y: currentYScale(value as any)!,
                      value,
                  }))
                : [];

            preparedData.push({
                id: `${id}-${x}`,
                seriesId: id,
                seriesName: name,
                color: pointColor || color,
                x,
                low,
                q1,
                median,
                q3,
                high,
                outliers,
                xPosition,
                yLow: yLow!,
                yQ1,
                yMedian: yMedian!,
                yQ3,
                yHigh: yHigh!,
                boxWidth: actualBoxWidth,
                boxHeight,
                whiskerWidth: actualWhiskerWidth,
                whiskerTop,
                whiskerBottom,
                verticalLineTop,
                verticalLineBottom,
                outlierPoints,
                outlierRadius,
                custom,
                htmlElements: [], // Initialize with empty array
            });
        });

        acc.push(...preparedData);

        return acc;
    }, []);
}
