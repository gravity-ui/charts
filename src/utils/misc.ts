export const randomString = (length: number, chars: string) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

export const getUniqId = () =>
    `gravity-chart.${randomString(5, '0123456789abcdefghijklmnopqrstuvwxyz')}`;
