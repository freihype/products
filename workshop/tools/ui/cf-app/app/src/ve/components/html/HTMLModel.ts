import { Model } from './model/Model';
export class HTMLModel extends Model {
    static _noFormatElements = {
        span: true,
        b: true,
        it: true
    };
    static escapeXml = value => {
        if (!value) {
            return value;
        }
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    static unEscapeXml = value => {
        if (!value || typeof value !== 'string') {
            return value;
        }
        return value.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    };
}
