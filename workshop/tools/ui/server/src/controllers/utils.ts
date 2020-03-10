import { SESSION_STATE_V3_KEY_SESSION_ID } from '../common/constants';

const SESSION_STATE_V3_KEY_OVERLOAD_PREVENTION_PERCENTAGE = 'perc';
const SESSION_STATE_V3_KEY_MOBILE_VISITOR = 'mvisitor';
const SESSION_STATE_V3_KEY_MOBILE_SESSION_ID = 'msn';
const VISIT_ID_CONCAT_SYMBOL = '_';

export const formatTime = (time: number) => {
    const d = new Date(time);
    return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
};

export const createSessionId = () => {
    let text = '';
    const enabled = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 32; i++) {
        text += enabled.charAt(Math.floor(Math.random() * enabled.length));
    }
    return text;
};

export const getSessionId = (sessionState: string) => {
    let keyValuePairs = sessionState.substring(3).split('=');

    let sessionId = null;
    let adaptiveVisitPercentage = -1;
    let mobileSessionId = null;
    let mobileVisitorId = null;
    for (let i = 0; i + 1 < keyValuePairs.length; i = i + 2) {
        let key = keyValuePairs[i];
        let value = keyValuePairs[i + 1];

        if (SESSION_STATE_V3_KEY_SESSION_ID === key) {
            sessionId = value;
        } else if (SESSION_STATE_V3_KEY_OVERLOAD_PREVENTION_PERCENTAGE === key) {
            let parsedValue = parseInt(value, 10);
            if (parsedValue !== null) {
                adaptiveVisitPercentage = parsedValue;
                if (adaptiveVisitPercentage > 100000) {
                    adaptiveVisitPercentage = 100000;
                } else if (adaptiveVisitPercentage < 0) {
                    adaptiveVisitPercentage = 0;
                }
            }
        } else if (SESSION_STATE_V3_KEY_MOBILE_VISITOR === key) {
            mobileVisitorId = value;
        } else if (SESSION_STATE_V3_KEY_MOBILE_SESSION_ID === key) {
            mobileSessionId = value;
        }
    }

    if (mobileVisitorId !== null && mobileSessionId !== null) {
        sessionId = mobileVisitorId + VISIT_ID_CONCAT_SYMBOL + mobileSessionId;
    }
    return sessionId;
};
