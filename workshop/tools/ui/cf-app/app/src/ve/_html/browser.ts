export const win: any = window;
export const doc: any = document;
export const isIE = /*@cc_on!@*/false || !!doc.documentMode;
export const isEdge = !(isIE) && !!win.StyleMedia;
export const isFirefox = typeof win.InstallTrigger !== 'undefined';
export const isOpera = (!!win.opr && !!win.opr.addons) || !!win.opera
                || navigator.userAgent.indexOf(' OPR/') >= 0;
export const isChrome = !!win.chrome && !!win.chrome.webstore && navigator.userAgent.toLowerCase().indexOf('googlebot') === -1;
export const isSafari = !isChrome && navigator.userAgent.toLowerCase().indexOf('safari') !== -1;
export const isBlink = (isChrome || isOpera) && !!win.CSS;
export const isGoogleBot = navigator.userAgent.toLowerCase().indexOf('googlebot') !== -1;
export const isWebkit = isSafari || isChrome;
