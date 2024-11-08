/** The halo appearing around the hovered part of series(point in line-type series or slice in pie charts) */
export type Halo = {
    /** Enable or disable the halo */
    enabled?: boolean;
    /** The opacity of halo */
    opacity?: number;
    /** The pixel size of the halo. Radius for point markers or width of the outside slice in pie charts. */
    size?: number;
};
