import { parse } from 'query-string';

function queryStringUrlReplacement(url, param, value) {
    let re = new RegExp("[\\?&]" + param + "=([^&#]*)"), match = re.exec(url), delimiter, newString;

    if (match === null) {
        // append new param
        let hasQuestionMark = /\?/.test(url);
        delimiter = hasQuestionMark ? "&" : "?";
        newString = url + delimiter + param + "=" + value;
    } else {
        delimiter = match[0].charAt(0);
        newString = url.replace(re, delimiter + param + "=" + value);
    }

    return newString;
}
export const replaceUrlParams = (params: any, url?: string) => {
    const parsed = {
        ...parse(url || location.hash),
        ...params
    }
    let str = "";
    for (let key in parsed) {
        if (str !== "") {
            str += "&";
        }
        str += key + "=" + (parsed[key]);
    }

    let href = '' + location.href;
    href = '' + href.split('#')[0] + '#' + str;
    return href;
}
export const replaceUrlParam = (name: string, value: string, url?: string) => {
    const parsed = parse(url || location.hash);
    let str = "";
    if (!(name in parsed)) {
        parsed[name] = value;
    }
    for (let key in parsed) {
        if (str !== "") {
            str += "&";
        }
        if (parsed[key]) {
            if (key !== name) {
                str += key + "=" + (parsed[key]);
            } else {
                str += key + "=" + value;
            }
        }
    }

    let href = '' + location.href;
    href = '' + href.split('#')[0] + '#' + str;
    return href;
}