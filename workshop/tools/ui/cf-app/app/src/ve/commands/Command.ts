import { mixin } from '@xblox/core/objects';
import { Metadata } from '../components/metadata';
import { HTMLWidget } from '..';

export class Command {

    _newId: any;
    name: string;
    _oldId: any;
    _id: string;
    _data: any;
    _index: number;
    _parentId: string;
    _widget: HTMLWidget;
    constructor(args: any = {}) {
        mixin(this, args);
    }

    execute(quite: boolean = false) {

    }

    undo() {

    }

    /**
	 * Check if an ancestor widget needs to be refreshed due to a change with
	 * one of its children (in particular, this widget) based on "refreshOnDescendantChange"
	 * property for an ancestor widget.
	 *
	 * @param  {davinci.ve._Widget} widget
	 * 				The widget instance that has been modified.
	 * @return {null | davinci.ve._Widget}
	 * 				if ancestor widget has the 'refreshOnDescendantChange' attribute set
	 * 				in its metadata, returns that ancestor widget
	 */
    _isRefreshOnDescendantChange(widget) {
        let ancestor;
        let w = widget;
        while (w && w.domNode && w.domNode.tagName != 'BODY') {
            const parent = w.getParent();
            if (parent && Metadata.queryDescriptor(parent.type, 'refreshOnDescendantChange')) {
                ancestor = parent;
            }
            w = parent;
        }
        return ancestor;
    }
}
