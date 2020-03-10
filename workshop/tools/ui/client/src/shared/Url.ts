
export const replaceParam = (url, param, value) => {
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