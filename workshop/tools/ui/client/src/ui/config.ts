declare var sessionReplay;
const ns = 'sessionReplay';
export const getConfig = (key: string, defaultValue = '') => {
    if (window[ns] && key in window[ns]) {
        return window[ns][key];
    }
    return defaultValue;
}