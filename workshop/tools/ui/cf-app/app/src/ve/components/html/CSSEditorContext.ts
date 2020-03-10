import { CSSEditorWidget } from './CSSEditorWidget';
export class CSSEditorContext {

    selectedWidget: CSSEditorWidget;
    selectedRule: any;
    subscriptions: any[];
    connects: any[];
    editor: any;
    constructor(editor) {
        this.editor = editor;
        this.connects = [];
        this.subscriptions = [];
        //ximpl.
        // this.subscriptions.push(dojo.subscribe("/davinci/ui/selectionChanged", this, this._selection));
    }

    _selection(selection) {
        if (selection[0] && selection[0].model) {
            const model = selection[0].model;
            let cssModel;

            if (model._edit_context) {
                // if it has _edit_context, it's a visual editor...
                // FIXME: make sure the selection event is targeted at this editor instance
                return;
            }

            if (model.elementType.substring(0, 3) == 'CSS') {
                const rule = model.getCSSRule();
                const fire = rule != this.selectedRule;
                // tslint:disable-next-line:prefer-conditional-expression
                if (rule) {
                    this.selectedWidget = new CSSEditorWidget(this);
                } else {
                    this.selectedWidget = null;
                }
                this.selectedRule = rule;
                if (fire) {
                    this.onSelectionChange();
                }
            }
        }
    }

    getSelection() {
        if (this.selectedWidget) {
            return [this.selectedWidget];
        }
        return [];
    }

    onSelectionChange() {
    }
}