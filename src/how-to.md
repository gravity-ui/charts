// ToDo: This is a draft to describe a way to add a new series/visualization. It should not be taken as a guide to action. But it's worth adding/editing if you see any errors or inaccuracies.

How to add new series type?

1. Start by adding a new story to Storybook. This will be an indicator of the health of your series.
   Describe the configuration of the series. What is required? Type, data, and name.

2. When you open the added story, you will see an error that your type is not in the allowed values.
   `It seems you haven't defined "series.type" property, or defined it incorrectly. Available values: [...].`

3. Add type of your series to SERIES_TYPE. Describe your series interface and add it to ChartSeries<T>

4. A new error is now displayed in Storybook: `Failed to create xScale`
   If your chart type doesn't need the X and Y axes: add your chart type to the CHARTS_WITHOUT_AXIS array.

If the axes are needed: ???

5. A new error is now displayed in Storybook: `Series type "sankey" does not support data preparation for series that do not support the presence of axes`
   Add series data preparation in useSeries. At this stage, you need to fill in all the unspecified values with default values, perform additional calculations, etc.

6. `The display method is not defined for a series with type ""`
   After the data is collected, the default values are set, etc. - you need to add the actual code to display the graph.
   Write it and add to useShapes hook.
