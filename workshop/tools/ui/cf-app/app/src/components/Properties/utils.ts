import { Checkbox, ICheckboxState } from 'office-ui-fabric-react/lib/Checkbox';
import { IComboBoxProps } from 'office-ui-fabric-react/lib/ComboBox';
import { ICheckboxProps, IProperty, IPropertyHandler, ITextFieldProps } from './types';
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const DefaultHandler = (): IPropertyHandler => {
    return {
        destroy: () => { }
    }
}

export const WidgetArgs = (
    type: string,
    attribute: string,
    value: any,
    label: string,
    handler: IPropertyHandler,
    property: IProperty) => {

    handler = handler || DefaultHandler();

    let defaults = {
        label: label,
        required: true
    };

    let result: any = { ...defaults };
    const onChanged = (newValue: any, newValue2: any) => {
        if (type === 'boolean') {
            newValue = newValue2;
            if (handler.instance) {
                const instance = handler.instance(attribute);
                if (instance) {
                    console.log('set to ', newValue);
                    // tslint:disable-next-line:no-object-literal-type-assertion
                    (instance as Checkbox).setState({
                        isChecked: newValue
                    } as ICheckboxState);
                    (instance as Checkbox).forceUpdate();
                }
            }
        }
        if (handler.changed) {

            if (type === 'enum') {
                // newValue = newValue.text
            }
            if (handler.instance) {
                const instance = handler.instance(attribute);
                if (instance) {
                    // tslint:disable-next-line:no-object-literal-type-assertion
                    /*
                    (instance as XComboBox).setState({
                        value: instance.props.options[newValue].text
                    });*/
                    (instance as Checkbox).forceUpdate();
                }
            }
            handler.changed(attribute, newValue, value, property);
        }
    };

    switch (type) {
        case 'boolean': {
            const args: ICheckboxProps = {
                ...result,
                defaultChecked: value,
                label: label,
                onChange: onChanged
            };
            result = args;
            break;
        }
        case 'string': {
            const args: ITextFieldProps = {
                ...result,
                defaultValue: value,
                onChanged: onChanged
            }
            result = args;
            break;
        }
        case 'enum': {
            const args: IComboBoxProps = {
                ...result,
                defaultValue: value,
                onChanged: onChanged,
                options: [],
                value: value,
                autoComplete: 'on'
            }
            result = args;
            break;
        }
        case 'picker': {
            const args: IComboBoxProps = {
                ...result,
                defaultValue: value,
                onChanged: onChanged,
                options: [],
                value: value

            }
            result = args;
            break;
        }
        case 'flags': {
            const args: any = {
                ...result,
                onChanged: onChanged,
                value: value
            }
            result = args;
            break;
        }
    }

    if (handler.args) {
        const newArgs = handler.args(attribute, result);
        if (newArgs) {
            result = {
                ...result,
                newArgs
            }
            // console.log('new args : ', result);
        }
    }

    return result;
}
