import { Registry } from '../registry';

export class DeliteHelper {
    _isAllowed(args) {
        if (args.parentType === 'delite/ViewStack' || args.parentType === 'delite/Accordion') {
            return true;
        } else if (args.parentType === 'delite/Panel') {
            return false;
        } else {
            return false;
        }
    }
    updateWidget() {
        console.error('updateWidget', arguments);
    }
    _getWidgetClassText(id, className) {
        return '';
        /*
        let text = '<span class=\'propertiesTitleClassName\'>';
        //text += node.tagName;
        if (id) {
            text += '#' + id;
        }
        if (className) {
            text += '.' + className.replace(/\s+/g, '.');
        }
        text += '</span> ';
        return text;*/
    }
    _remove_prefix(str) {
        let returnstr = str;
        let prefixes_to_remove = [
            'dijit/form/',
            'dijit/layout/',
            'dijit/',
            'dojox/mobile/',
            'html.',
            'html/',
            'OpenAjax.',
            'OpenAjax/'
        ];
        for (let i = 0; i < prefixes_to_remove.length; i++) {
            if (str.indexOf(prefixes_to_remove[i]) == 0) { // use ===?
                returnstr = str.substr(prefixes_to_remove[i].length);
                //FIXME: Another hack. Need a better approach for this.
                //Special case logic for HTML widgets
                if (prefixes_to_remove[i] == 'html.') {
                    returnstr = '&lt;' + returnstr + '&gt;';
                }
                break;
            }
        }
        return returnstr;
    }
    getWidgetNameText(widget) {

        if (widget.domNode && widget.domNode.label) {
            let text = '<span class=\'propertiesTitleWidgetName\'>';
            text += '</span> ';
            return ''
        }

        let text = '<span class=\'propertiesTitleWidgetName\'>';
        text += this._remove_prefix(widget.type);
        text += '</span> ';
        return text;
    }
    getWidgetText(widget) {
        if (widget.domNode) {
            let _label = null;
            // tslint:disable-next-line:prefer-conditional-expression
            if (widget.domNode.get) {
                _label = widget.domNode.get('label');
            } else {
                _label = widget.domNode.label;
            }
            return _label;
        }
        return widget.type;
    }
    __getData(widget, options) {
        if (!widget) {
            return undefined;
        }

        let data = widget._getData(options);
        let _uniqueId = Registry.getUniqueId(widget.type.replace(/\./g, '_'));
        _uniqueId = _uniqueId.replace('delite/', 'd-').toLowerCase();
        if (widget.id === 'no_id') {
            widget.id = _uniqueId;
            data.properties['id'] = _uniqueId;
            data.properties.id = _uniqueId;
        }
        return data;
    }
    create(widget) {
        widget._srcElement.setAttribute('id', widget.id);
    }
    onAdded(target, src) {
        if (src.type === 'xblox/RunScript') {
            return target;
        } else {
            return src;
        }
    }
    _getChildren(widget, attach) {
        let dijitWidget = widget.dijitWidget;
        // First, get children from slider's containerNode.
        let children = []; //widget._getChildren(attach);
        return children;

        /*
        function getWidget(node) {
            if (attach) {
                return davinci.ve.widget.getWidget(node);
            } else {
                let widget = node._dvWidget;
                if (widget) {
                    return widget;
                }
            }
        }

        dijitWidget.domNode.children.forEach((node) => {
            let childWidget = getWidget(node);
            if (childWidget) {
                if (childWidget.type == 'xblox/RunScript') {
                    debugger;
                    console.log('enum ', childWidget);
                    children.push(childWidget);
                }

            }
        });
        return children;
        */

    }
    ___getChildrenData(/*Widget*/ widget, /*Object*/ options) {
        // summary:
        //		The child in the markup of a button tag is its text content, so return that.
        //
        return undefined;
    }
}
