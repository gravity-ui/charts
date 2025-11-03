export interface ChartBrush {
    borderColor?: string;
    borderWidth?: number;
    handles?: {
        borderColor?: string;
        borderWidth?: number;
        enabled?: boolean;
        /**
         * Height of the handles in pixels.
         * @default 15
         */
        height?: number;
        /**
         * Width of the handles in pixels.
         * @default 8
         */
        width?: number;
    };
    style?: {
        fillOpacity?: number;
    };
}
