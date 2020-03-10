import * as React from 'react';
import * as lodash from 'lodash';

import { IconButton, ActionButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IComboBoxOption, SelectableOptionMenuItemType, IComboBox, ComboBox, VirtualizedComboBox } from 'office-ui-fabric-react/lib/ComboBox';
import { autobind, assign } from '@uifabric/utilities';

export class XComboBox extends React.Component<any, {
    options: IComboBoxOption[];
    // selectedOptionKey?: string | number;
    value?: string;
    onChanged?: any;
    onResolveOptions?: any;
}> {
    private scaleOptions: IComboBoxOption[] = [];
    private _basicCombobox: IComboBox;

    constructor(props: {}) {
        super(props);
        this.state = {
            options: (props as any).options,
            value: (props as any).defaultValue
        };
    }

    public render() {
        const { options, value } = this.state;
        return (
            <ComboBox
                componentRef={this._basicComboBoxComponentRef}
                label={this.props.label}
                allowFreeform={true}
                autoComplete='on'
                options={options}
                onChanged={this._onChanged}
                onResolveOptions={this._getOptions}
                value={value && value}
            />
        );
    }
    @autobind
    private _getOptions(currentOptions: IComboBoxOption[]): IComboBoxOption[] {
        if (this.props.onResolveOptions) {
            this.props.onResolveOptions(currentOptions).then((newOptions) => {
                this.setState({
                    options: newOptions,
                    value: this.state.value
                });
            });
        }
        if (this.state.options.length > 0) {
            return this.state.options;
        }
    }

    @autobind
    private _onChanged(option: IComboBoxOption, index: number, value: string) {
        console.log('onc cha');
        let _val = value;
        if (option !== undefined) {
            this.setState({
                value: option.text as string
            });
            _val = option.text as string;
        } else if (value !== undefined) {
            const newOption: IComboBoxOption = { key: value, text: value };

            this.setState({
                options: [...this.state.options, newOption],
                value: newOption.key as string
            });
            _val = newOption.key as string;
        } else if (index !== undefined) {
            _val = this.state.options[index] ? this.state.options[index]['key'] as string : undefined;
        }

        console.log('cb changed', this);
        this.props.onChanged(this.state.options[index].key);
    }

    @autobind
    private _basicComboBoxOnClick(): void {
        this._basicCombobox.focus(true);
    }

    @autobind
    private _basicComboBoxComponentRef(component: IComboBox) {
        this._basicCombobox = component;
    }
}
