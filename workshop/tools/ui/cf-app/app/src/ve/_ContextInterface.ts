import { Evented } from '../shared/Evented';
import { ContextBase } from './_ContextBase';
import * as $ from 'jquery';
import * as lodash from 'lodash';
export class ContextInterface extends ContextBase {
    rootNode: any;
    _chooseParent: any;
    _blockChange: any;
    blockChange(arg0: any): any {
        throw new Error('Method not implemented.');
    }
    _activeTool: any;
    onKeyDown(event: JQueryEventObject) {
        //console.log('key down');
        //FIXME: Research task. This routine doesn't get fired when using CreateTool and drag/drop from widget palette.
        // Perhaps the drag operation created a DIV in application's DOM causes the application DOM
        // to be the keyboard focus?
        if (this._activeTool && this._activeTool.onKeyDown) {
            this._activeTool.onKeyDown(event.originalEvent);
        }
        $('body').trigger('keydown', event);
    }
    onKeyUp(event) {
        //FIXME: Research task. This routine doesn't get fired when using CreateTool and drag/drop from widget palette.
        // Perhaps the drag operation created a DIV in application's DOM causes the application DOM
        // to be the keyboard focus?
        if (this._activeTool && this._activeTool.onKeyUp) {
            this._activeTool.onKeyUp(event);
        }
        $('body').trigger('keyup', event);
    }
    onMouseDown(e: JQueryEventObject) {
        //console.log('on mouse down', e, this);
        if (this._activeTool && this._activeTool.onMouseDown && !this._blockChange) {
            this._activeTool.onMouseDown(e.originalEvent);
        }
        this.blockChange(false);
        $('body').trigger('mousedown', e);
    }

    onMouseUp(e: JQueryEventObject) {
        if (this._activeTool && this._activeTool.onMouseUp) {
            this._activeTool.onMouseUp(e.originalEvent);
        }
        this.blockChange(false);
        this.emit('/davinci/ve/context/mouseup', event);
        $('body').trigger('mouseup', event);
    }
    onMouseClick(e) {
        //console.log('on click', e, this);
    }
    onMouseMove(event: JQueryEventObject) {
        if (this._activeTool && this._activeTool.onMouseMove && !this._blockChange) {
            this._activeTool.onMouseMove(event.originalEvent);
        }
    }
}
