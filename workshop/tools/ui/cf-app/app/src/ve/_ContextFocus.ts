import { ContextInterface } from './_ContextInterface';
import { Focus } from './Focus';
import { create } from './_html';

export class ContextFocus extends ContextInterface {
    getSelection(): any {
        throw new Error('Method not implemented.');
    }
    _focuses: any;
    hideFocusAll(startIndex?: number) {
        if (!startIndex) {
            startIndex = 0;
        }
        const containerNode = this.getFocusContainer();
        if (this._focuses) {
            for (let i = startIndex; i < this._focuses.length; i++) {
                const focus = this._focuses[i];
                if (focus.domNode.parentNode == containerNode) {
                    focus.hide();
                    containerNode.removeChild(focus.domNode);
                }
            }
        }
    }
    onExtentChange(args) {
        const { focus, oldBox, newBox, applyToWhichStates } = args;
        if (this._activeTool && this._activeTool.onExtentChange && !this._blockChange) {
            const index = this._focuses.indexOf(focus);
            if (index >= 0) {
                this._activeTool.onExtentChange({
                    index: index,
                    oldBoxes: [oldBox],
                    newBox: newBox,
                    applyToWhichStates: applyToWhichStates
                });
            }
        }
        this.blockChange(false);
    }
    focus(state, index?: any, inline?: any) {
        this._focuses = this._focuses || [];
        let clear = false;
        if (index === undefined) {
            clear = true;
            index = 0;
        }
        let focus;
        const containerNode = this.getFocusContainer();
        if (index < this._focuses.length) {
            focus = this._focuses[index];
        } else {
            /*dojo.withDoc(this.getDocument(), dojo.hitch(this, function () {*/
            focus = new Focus(containerNode);
            focus._edit_focus = true;
            focus._context = this;
            /*}));*/
            this._focuses.push(focus);
        }

        //FIXME: DELETE THIS var containerNode = this.getContainerNode();

        if (state) {
            if (state.box && state.op) {
                if (!focus._connected) {
                    // @ximpl.
                    // this._connects.push(connect.connect(focus, 'onExtentChange', this, 'onExtentChange'));
                    focus.on('onExtentChange', this.onExtentChange, null, this);
                    focus._connected = true;
                }
                const w = this.getSelection();
                focus.resize(state.box, w[0]);
                const windex = index < w.length ? index : 0;	// Just being careful in case index is messed up
                focus.resize(state.box, w[windex]);
                focus.allow(state.op);
                if (focus.domNode.parentNode != containerNode) {
                    containerNode.appendChild(focus.domNode);
                }
                focus.show(w[windex], { inline: inline });
            } else { // hide
                focus.hide();
            }
            index++; // for clear
        } else if (!clear) { // remove
            if (focus.domNode.parentNode == containerNode) {
                focus.hide();
                containerNode.removeChild(focus.domNode);
            }
            this._focuses.splice(index, 1);
            this._focuses.push(focus); // recycle
        }
        if (clear) {
            this.hideFocusAll(index);
        }

    }
    /**
     * Returns the container node for all of the focus chrome DIVs
     */
    getFocusContainer() {
        let _c = document.getElementById('focusContainer');
        if (!_c) {
            _c = create('div', { class: 'focusContainer', id: 'focusContainer' }, document.body);
            //davinci.Workbench.focusContainer = _c;
        }
        return _c;
    }
}
