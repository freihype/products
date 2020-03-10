/**
 * @TODOS:
 * - add namespaces
 * - remove window
 * - augment consumer API
 * - use std array
 * - add framework constraint
 * - move dom api out of here
 * - define widget.id better
 * - add search by class
 */
const _widgetTypeCtr = {};

const hash = {};
import * as _ from 'lodash';

export class Registry {
    // summary:
    //		Registry of existing widget on page, plus some utility methods.

    // length: Number
    //		Number of registered widgets
    static _length: number = 0;
    static add(widget) {
        // summary:
        //		Add a widget to the registry. If a duplicate ID is detected, a error is thrown.
        // widget: dijit/_WidgetBase
        //		Any dijit/_WidgetBase subclass.
        /*
        if (this._hash[widget.id]) {
            if (has('xblox')) {
                this.remove(widget.id);
                this.add(widget);
            } else {
                throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
            }
        }*/
        hash[widget.id] = widget;
        this._length++;
    }
    /**
     * Remove a widget from the registry. Does not destroy the widget; simply
     * removes the reference.
     * @param id
     */
    static remove(id) {
        if (hash[id]) {
            delete hash[id];
            this._length--;
        }
    }
    /**
     *
     * @param id {String|Widget}
     * @returns {String|Widget}
     */
    static byId(id: string | any): string | any {
        // summary:
        //		Find a widget by it's id.
        //		If passed a widget then just returns the widget.
        return typeof id == 'string' ? hash[id] : id;	// dijit/_WidgetBase
    }
    byNode(/*DOMNode*/ node) {
        // summary:
        //		Returns the widget corresponding to the given DOMNode
        return hash[node.getAttribute('widgetId')]; // dijit/_WidgetBase
    }

    /**
     * Convert registry into a true Array
     * @example:
     *	Work with the widget .domNodes in a real Array
     *	array.map(registry.toArray(), function(w){ return w.domNode; });
     * @returns {obj[]}
     */
    toArray() {
        return _.values(_.mapKeys(hash, function (value: any, key) { value.id = key; return value; }));
    }
    /**
     * Generates a unique id for a given widgetType
     * @param widgetType {string}
     * @returns {string}
     */
    static getUniqueId(widgetType) {
        let id;
        do {
            id = widgetType + '_' +
                (widgetType in _widgetTypeCtr ?
                    ++_widgetTypeCtr[widgetType] : _widgetTypeCtr[widgetType] = 0);
        } while (hash[id]);
        return id;
    }
    /**
     * Search subtree under root returning widgets found.
     * Doesn't search for nested widgets (ie, widgets inside other widgets).
     * @param root {HTMLElement} Node to search under.
     * @param skipNode {HTMLElement} If specified, don't search beneath this node (usually containerNode).
     * @returns {Array}
     */
    static findWidgets(root, skipNode?: HTMLElement) {
        const outAry = [];
        function getChildrenHelper(root) {
            for (let node = root.firstChild; node; node = node.nextSibling) {
                if (node.nodeType == 1) {
                    const widgetId = node.getAttribute('widgetId');
                    if (widgetId) {
                        const widget = hash[widgetId];
                        if (widget) {	// may be null on page w/multiple dojo's loaded
                            outAry.push(widget);
                        }
                    } else if (node !== skipNode) {
                        getChildrenHelper(node);
                    }
                }
            }
        }
        getChildrenHelper(root);
        return outAry;
    }
    _destroyAll() {
        // summary:
        //		Code to destroy all widgets and do other cleanup on page unload

        // Clean up focus manager lingering references to widgets and nodes
        // Destroy all the widgets, top down
        debugger;
        //@ximpl.
        /*
        _.each(Registry.findWidgets(win.body()), function (widget) {
            // Avoid double destroy of widgets like Menu that are attached to <body>
            // even though they are logically children of other widgets.
            if (!widget._destroyed) {
                if (widget.destroyRecursive) {
                    widget.destroyRecursive();
                } else if (widget.destroy) {
                    widget.destroy();
                }
            }
        });*/
    }
    static getEnclosingWidget(node) {
        // summary:
        //		Returns the widget whose DOM tree contains the specified DOMNode, or null if
        //		the node is not contained within the DOM tree of any widget
        while (node) {
            const id = node.nodeType == 1 && node.getAttribute('widgetId');
            if (id) {
                return hash[id];
            }
            node = node.parentNode;
        }
        return null;
    }

    // In case someone needs to access hash.
    // Actually, this is accessed from WidgetSet back-compatibility code
    _hash: any = hash
}
