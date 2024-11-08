import {withNaming} from '@bem-react/classname';

export const CN_NAMESPACE = 'gcharts-';

export const cn = withNaming({e: '__', m: '_'});
export const block = withNaming({n: CN_NAMESPACE, e: '__', m: '_'});
