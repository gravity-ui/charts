import React from 'react';

import type {ChartYAxis} from '../../types';

// Internal axis list for built-in tooltips; public custom renderer arguments retain yAxis[0].
export const TooltipAxesContext = React.createContext<ChartYAxis[] | undefined>(undefined);
