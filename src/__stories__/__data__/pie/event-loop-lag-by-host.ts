import type {ChartData} from '../../../types';

const eventLoopLagSeries = [
    {name: '5kk5u4oyzpwauxz6', y: 35.97800540387881, color: 'rgb(146,219,0)'},
    {name: 'amnang73ykrauvmr', y: 32.82894340882429, color: 'rgb(0,146,219)'},
    {name: 'apbnx5zhnsa25i76', y: 39.290664717139414, color: 'rgb(219,183,0)'},
    {name: 'chpbb74u6wjynwkw', y: 36.17347349949094, color: 'rgb(219,0,0)'},
    {name: 'cvsbbdhfvjilykxc', y: 38.474789725818205, color: 'rgb(0,219,146)'},
    {name: 'ebsj67ivu2s7lyid', y: 33.596069471369695, color: 'rgb(37,0,219)'},
    {name: 'fesodw72jyizlhtm', y: 58.48644563854549, color: 'rgb(121,236,50)'},
    {name: 'g6wzj6mf5rp4luev', y: 35.41893454424245, color: 'rgb(14,63,103)'},
    {name: 'h7eubccohmplcpkc', y: 35.26838730545454, color: 'rgb(242,231,28)'},
    {name: 'hbeeyoky657o22nm', y: 36.229831182690894, color: 'rgb(121,43,12)'},
    {name: 'ka43bxu7qvjuzz6i', y: 33.05156557648486, color: 'rgb(32,223,182)'},
    {name: 'mviumyqmcnivzron', y: 31.782128117866684, color: 'rgb(139,9,59)'},
    {name: 'p2xavtmg2txyckro', y: 41.984732432242424, color: 'rgb(38,103,14)'},
    {name: 'qbp7zjyztciiqob3', y: 32.298418417212126, color: 'rgb(28,121,242)'},
    {name: 'qcdhpgkyeeemcj22', y: 31.466091308169727, color: 'rgb(113,121,12)'},
    {name: 'skxg7vk5b2kncwl3', y: 32.33242489866666, color: 'rgb(223,108,32)'},
    {name: 'uaskdwsxheed2vwj', y: 32.330155714666674, color: 'rgb(9,139,126)'},
    {name: 'wl47gxjfguikzmli', y: 39.68617055490912, color: 'rgb(217,23,75)'},
    {name: 'xxocsodbzvzxdoey', y: 33.773912429333336, color: 'rgb(60,242,28)'},
    {name: 'zxyz63z6pvafllio', y: 31.307790639272728, color: 'rgb(50,12,121)'},
];

const segments = eventLoopLagSeries.map(({name, y, color}) => ({
    name,
    value: y,
    color,
}));

const total = segments.reduce((sum, segment) => sum + segment.value, 0);

export const pieEventLoopLagByHostData: ChartData = {
    legend: {enabled: false},
    series: {
        data: [
            {
                type: 'pie',
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    html: true,
                },
                data: segments.map((segment) => {
                    const percentage = (segment.value / total) * 100;

                    return {
                        ...segment,
                        label: `${segment.name}<br/>${percentage.toFixed(2)}%`,
                    };
                }),
            },
        ],
    },
};
