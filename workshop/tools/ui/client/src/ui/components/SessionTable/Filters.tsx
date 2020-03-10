import { FormControl, MenuItem, Select, withStyles } from '@material-ui/core';
import * as React from "react";
import { FilterTypeMap, defaultOperands } from '../../../shared';
import { operatorTypes } from './FilterBuilder/Settings';
const styles = theme => ({
    head: {
        ...theme.mixins.gutters(),
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
        fontSize: theme.typography.pxToRem(12),
        padding: theme.spacing.unit * 4,
        width: '80%'
    },
    formControlInput: {
        padding: '4px',
        fontSize: '14px'
    }
});

class NumberFilterC extends React.PureComponent<any, any> {
    state: { value: null }
    render() {
        const { prop, handleChange, classes, selected } = this.props;
        const value = this.state ? this.state.value : selected || defaultOperands[FilterTypeMap[prop]];
        return <FormControl className={classes.formControl}>
            <Select
                onChange={e => {
                    this.setState({ value: e.target.value })
                    handleChange(e.target.value)
                }}
                className={classes.formControlInput}
                value={value}
                inputProps={{
                    name: "operator",
                    id: "operator-select"
                }}

            >
                {operatorTypes.get(FilterTypeMap[prop]).map(opt => (
                    <MenuItem className={classes.formControlInput} value={opt.value} key={opt.Label}>
                        {opt.Label}
                    </MenuItem>
                ))
                }
            </Select>
        </FormControl>
    }
}
export const NativeTypeFilter = withStyles(styles)(NumberFilterC);