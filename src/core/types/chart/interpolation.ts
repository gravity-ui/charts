/** Interpolation settings shared by line and area series. */
export type SeriesInterpolation =
    | {type: 'linear'}
    | {type: 'monotone'}
    | {
          type: 'cardinal';
          /**
           * Controls how tightly the curve follows the control points.
           * @minimum 0
           * @maximum 1
           * @default 0
           */
          tension?: number;
      }
    | {
          type: 'step';
          /**
           * Where Y changes between adjacent points `(x1, y1)` and `(x2, y2)`.
           * - `'middle'`: Change Y halfway between x1 and x2.
           * - `'before'`: Change Y at x1, then continue horizontally.
           * - `'after'`: Continue horizontally at y1 until x2, then change Y.
           * @default 'after'
           */
          position?: 'middle' | 'before' | 'after';
      };
