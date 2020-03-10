export class CSSEditorWidget {

    values: any;
    context: any;
    constructor(context) {
        this.context = context;
    }

    getValues() {
        if (!this.values) {
            this.values = {};
            const rule = this.context.selectedRule;

            rule.properties.forEach(property => {
                this.values[property.name] = property.value;
            });
        }
        return this.values;
    }
}
