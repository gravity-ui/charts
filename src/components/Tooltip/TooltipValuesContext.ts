import React from 'react';

import type {PreparedHovered} from './DefaultTooltipContent/utils';

// Internal transport for values prepared by useTooltip; custom renderer props stay unchanged.
export const TooltipValuesContext = React.createContext<PreparedHovered | undefined>(undefined);
