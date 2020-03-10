import { clone } from '@xblox/core/objects';
import { fstat } from 'fs';
import * as fs from 'fs';

export class States {

    static _DYNAMIC_PROPERTIES: any = { width: 1, height: 1, top: 1, right: 1, bottom: 1, left: 1 };
    static NORMAL: string = 'Normal';
    static DELTAS_ATTRIBUTE: string = 'data-maq-deltas';
    static APPSTATES_ATTRIBUTE: string = 'data-maq-appstates';
    reImportant: RegExp = /^(.*)(!\ *important)(.*)/;
    static _isEmpty(object) {
        for (const name in object) {
            if (object.hasOwnProperty(name)) {
                return false;
            }
        }
        return true;
    }
    /**
	 * Call JSON stringify on an object, make sure
	 * all single quotes are escaped and replace double-quotes with single quotes
	 */
    static stringifyWithQuotes(o) {
        let str = JSON.stringify(o);
        // Escape single quotes that aren't already escaped
        str = str.replace(/(\\)?'/g, ($0, $1) => $1 ? $0 : '\\\'');
        // Replace double quotes with single quotes
        str = str.replace(/"/g, '\'');
        return str;
    }
    static serialize(node) {
        const that = this;
        const munge = propval => {
            let str = null;
            if (node[propval]) {
                const o = clone(node[propval]);
                delete o['undefined'];
                if (!that._isEmpty(o)) {
                    str = this.stringifyWithQuotes(o);
                }
            }
            return str;
        };
        const obj: any = {};
        if (!node) {
            return obj;
        }
        const maqAppStates = munge('_maqAppStates');
        if (typeof maqAppStates == 'string') {
            obj.maqAppStates = maqAppStates;
        }
        const maqDeltas = munge('_maqDeltas');
        if (typeof maqDeltas == 'string') {
            obj.maqDeltas = maqDeltas;
        }
        return obj;
    }

    static normalize(type, node, name, value) {
        switch (type) {
            case 'style': {
                const currentStatesList = this.getStatesListCurrent(node);
                for (let i = 0; i < currentStatesList.length; i++) {
                    currentStatesList[i] = 'Normal';
                }
                const normalValueArray = this.getStyle(node, currentStatesList, name);
                if (normalValueArray) {
                    for (let i = 0; i < normalValueArray.length; i++) {
                        if (normalValueArray[i][name]) {
                            value = normalValueArray[i][name];
                        }
                    }
                }
                break;
            }
        }
        return value;
    }
    static getStateContainersForNode(node) {
        const allStateContainers = [];
        let n = node;
        while (n) {
            if (n._maqAppStates) {
                allStateContainers.splice(0, 0, n);
            }
            if (n.tagName == 'BODY') {
                break;
            }
            n = n.parentNode;
        }
        return allStateContainers;
    }
    static resetState(node) {
        /*
        if (!node) {
            return;
        }
        const stateContainers = this.getStateContainersForNode(node);
        const focusState = this.getFocus(node.ownerDocument.body);
        for (let i = 0; i < stateContainers.length; i++) {
            const stateContainerNode = stateContainers[i];
            const currentState = this.getState(stateContainerNode);
            const focus = (focusState && stateContainerNode == focusState.stateContainerNode && currentState == focusState.state);
            this.setState(currentState, stateContainerNode, {
                focus: focus,
                updateWhenCurrent: true,
                silent: false
            });
        }*/
    }

    static getStatesListCurrent(node) {
        const statesList = [];
        if (node) {
            let pn = node.parentNode;
            while (pn) {
                if (pn._maqAppStates) {
                    statesList.splice(0, 0, pn._maqAppStates.current);
                }
                if (pn.tagName == 'BODY') {
                    break;
                }
                pn = pn.parentNode;
            }
        }
        return statesList;
    }
    static _styleArrayMixin(styleArray1, styleArray2) {
        // Remove all entries in styleArray1 that matching entry in styleArray2
        if (styleArray2) {
            styleArray2.forEach(item2 => {
                // tslint:disable-next-line:forin
                for (const prop2 in item2) {
                    for (let i = styleArray1.length - 1; i >= 0; i--) {
                        const item1 = styleArray1[i];
                        if (item1.hasOwnProperty(prop2)) {
                            styleArray1.splice(i, 1);
                        }
                    }
                }
            });

            // Add all entries from styleArray2 onto styleArray1
            for (let k = 0; k < styleArray2.length; k++) {
                styleArray1.push(styleArray2[k]);
            }
        }
    }
    ///*FIXME state */
    static getStyle(node, statesList, name) {
        let styleArray;
        const newStyleArray = [];

        //FIXME: Make sure node and statesList are always sent to getStyle
        statesList.forEach(state => {
            // return all styles specific to this state
            styleArray = node && node._maqDeltas && node._maqDeltas[state] && node._maqDeltas[state].style;
            // states defines on deeper containers override states on ancestor containers
            this._styleArrayMixin(newStyleArray, styleArray);
            if (arguments.length > 2) {
                // Remove any properties that don't match 'name'
                if (newStyleArray) {
                    for (let j = newStyleArray.length - 1; j >= 0; j--) {
                        const item = newStyleArray[j];
                        for (const prop in item) {		// should be only one prop per item
                            if (prop != name) {
                                newStyleArray.splice(j, 1);
                                break;
                            }
                        }
                    }
                }
            }
        });

        return newStyleArray;
    }
    static normalizeArray(type, node, name, valueArray) {
        let newValueArray = clone(valueArray);
        switch (type) {
            case 'style':
                const currentStatesList = this.getStatesListCurrent(node);
                for (let i = 0; i < currentStatesList.length; i++) {
                    currentStatesList[i] = 'Normal';
                }
                const normalValueArray = this.getStyle(node, currentStatesList, name);
                if (normalValueArray) {
                    // Remove all entries from valueArray that are in normalValueArray
                    for (let i = 0; i < normalValueArray.length; i++) {
                        const nItem = normalValueArray[i];
                        // tslint:disable-next-line:forin
                        for (const nProp in nItem) { // should be only one property
                            for (let j = newValueArray.length - 1; j >= 0; j--) {
                                const vItem = newValueArray[j];
                                for (const vProp in vItem) { // should be only one property
                                    if (vProp == nProp) {
                                        newValueArray.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Append values from normalValueArray
                    newValueArray = newValueArray.concat(normalValueArray);
                }
                break;
        }
        return newValueArray;
    }
    static _getFormattedValue(name, value) {
        //FIXME: This code needs to be analyzed more carefully
        // Right now, only checking six properties which might be set via dynamic
        // drag actions on canvas. If just a raw number value, then add "px" to end.
        if (name in this._DYNAMIC_PROPERTIES) {
            if (typeof value != 'string') {
                return value + 'px';
            }
            let trimmed_value = value.trim();
            // See if value is a number
            if (/^[-+]?[0-9]*\.?[0-9]+$/.test(trimmed_value)) {
                value = trimmed_value + 'px';
            }
        }
        return value;
    }
    static getState(node) {
        return node && node._maqAppStates && node._maqAppStates.current;
    }

    static propertyDefinedForAnyCurrentState(node, proplist) {
        let whichState;
        const maqDeltas = node._maqDeltas;

        if (maqDeltas) {
            const stateContainers = this.getStateContainersForNode(node);
            //outer_loop:
            for (let i = stateContainers.length - 1; i >= 0; i--) {
                const stateContainer = stateContainers[i];
                const currentState = this.getState(stateContainer);
                const stateIndex = (!currentState || currentState == this.NORMAL) ? 'undefined' : currentState;
                const stateStyles = maqDeltas[stateIndex] && maqDeltas[stateIndex].style;
                if (stateStyles) {
                    for (let s = 0; s < stateStyles.length; s++) {
                        const o = stateStyles[s];
                        for (let j = 0; j < proplist.length; j++) {
                            if (o.hasOwnProperty(proplist[j])) {
                                whichState = currentState;
                                // break outer_loop;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return whichState;
    }

    /**
	 * Update the CSS for the given node for the given application "state".
	 * This routine doesn't actually do any screen updates; instead, updates happen
	 * by publishing a /maqetta/appstates/state/changed event, which indirectly causes
	 * the _update() routine to be called for the given node.
	 * @param {Element} node
	 * @param {string} state
	 * @param {Array} styleArray  List of CSS styles to apply to this node for the given "state".
	 * 		This is an array of objects, where each object specifies a single propname:propvalue.
	 * 		eg. [{'display':'none'},{'color':'red'}]
	 * @param {boolean} _silent  If true, don't broadcast the state change via /maqetta/appstates/state/changed
	 */
    static setStyle(node, state, styleArray, silent) {
        if (!node || !styleArray) { return; }

        node._maqDeltas = node._maqDeltas || {};
        node._maqDeltas[state] = node._maqDeltas[state] || {};
        node._maqDeltas[state].style = node._maqDeltas[state].style || [];

        // Remove existing entries that match any of entries in styleArray
        let oldArray = node._maqDeltas[state].style;
        if (styleArray) {
            for (let i = 0; i < styleArray.length; i++) {
                let newItem = styleArray[i];
                // tslint:disable-next-line:forin
                for (let newProp in newItem) {	// There should be only one prop per item
                    for (let j = oldArray.length - 1; j >= 0; j--) {
                        let oldItem = oldArray[j];
                        for (let oldProp in oldItem) {	// There should be only one prop per item
                            if (newProp == oldProp) {
                                oldArray.splice(j, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
        //Make sure all new values are properly formatted (e.g, add 'px' to end of certain properties)
        let newArray;
        if (styleArray) {
            for (let j = 0; j < styleArray.length; j++) {
                // tslint:disable-next-line:forin
                for (let p in styleArray[j]) {	// should be only one prop per item
                    let value = styleArray[j][p];
                    if (typeof value != 'undefined' && value !== null) {
                        if (typeof newArray == 'undefined') {
                            newArray = [];
                        }
                        let o = {};
                        o[p] = this._getFormattedValue(p, value);
                        newArray.push(o);
                    }
                }
            }
        }
        if (oldArray && newArray) {
            node._maqDeltas[state].style = oldArray.concat(newArray);
        } else if (oldArray) {
            node._maqDeltas[state].style = oldArray;
        } else if (newArray) {
            node._maqDeltas[state].style = newArray;
        } else {
            node._maqDeltas[state].style = undefined;
        }

        if (!silent) {
            // connect.publish('/davinci/states/state/style/changed', [{ node: node, state: state, style: styleArray }]);
        }
        //this._updateSrcState(node);
    }
}
