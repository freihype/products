/* tslint:disable:no-unused-variable */
import * as React from 'react';
/* tslint:enable:no-unused-variable */
import { Link } from 'office-ui-fabric-react/lib/Link';
import { Checkbox, ICheckboxState } from 'office-ui-fabric-react/lib/Checkbox';

const hasFlag = (field, enumValue) => {
    //noinspection JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage
    // tslint:disable-next-line:no-bitwise
    return ((1 << enumValue) & field) ? true : false;
};
const disableFlag = (enumValue, field) => {
    enumValue &= ~(1 << field);
    return enumValue;
};
export interface IFlagsProperties {
    flags: any[];
    value: number;
    onChanged: (val) => void;
    hex: boolean;
}

export class FlagsWidget extends React.Component<IFlagsProperties, {
    flags: any[];
    value: number;
}> {
    private _selection: Selection;
    public state = {
        flags: [],
        value: 0
    }
    constructor(props) {
        super(props);

    }
    public isChecked(val, itemVal) {
        if (this.props.hex === true) {
            return val & itemVal ? true : false;
        }
        return hasFlag(val, itemVal);
    }

    public value: number;
    public componentDidMount() {
        this.value = this.props.value;
    }
    public render() {
        const { flags, value } = this.props;
        const self = this;
        return (
            <div className='cf-Flags'>
                {
                    flags.map((flag, index) => {
                        return <Checkbox key={'check-' + index}
                            label={flag.label}
                            defaultChecked={this.isChecked(this.props.value, flag.value)}
                            onChange={(el, val) => {
                                if (!this.props.hex) {
                                    if (val === false) {
                                        this.value = disableFlag(this.value, flag._value);
                                    } else {
                                        this.value += (1 << flag.value);
                                    }
                                } else {
                                    if (val === true) {
                                        this.value = this.value | flag.value;
                                    } else {
                                        this.value &= ~flag.value;
                                    }
                                    //console.log('changed, initial value ' + self.value + ' | flag value =' + flag.value + ' | new value ' + this.value);
                                    // console.log('old value ' + value, userVal);
                                    // console.log('old value ' + value, userVal);
                                }
                                this.props.onChanged(this.value);
                            }}
                        />
                    })
                }
            </div>
        );
    }
}
