import * as React from "react";

import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { withStyles, TextField } from "@material-ui/core";
const styles = theme => ({
    root: {
        display: 'flex',
    },
    formControl: {
        margin: theme.spacing.unit * 10
    },
    field: {
        paddingLeft: theme.spacing.unit * 10
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    },
});
export class FormFieldsC extends React.Component<any, any> {

    constructor(props) {
        super(props);
        this.state = {
            formFields: props.config.filter.formFields,
            fields: props.config.filter.fields
        }
    }
    handleChange = name => event => {
        this.setState({ formFields: event.target.value });
        this.props.owner.onChange(name, event.target.value);
    };
    handleCSSSelectorChange(event) {
        this.setState({ fields: event.target.value });
        this.props.owner.onChange('fields', event.target.value);
    };
    render() {
        const { name, classes } = this.props;
        return <div>

            <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel focused={true} component="legend">Disable recording for form fields</FormLabel>
                <RadioGroup
                    aria-label="Gender"
                    name="gender1"
                    className={classes.group}
                    value={this.state.formFields}
                    onChange={this.handleChange(name)}
                >
                    <FormControlLabel className={classes.field} value="all" control={<Radio />} label="All" />
                    <FormControlLabel className={classes.field} value="none" control={<Radio />} label="None" />
                    <FormControlLabel className={classes.field} value="allExcept" control={<Radio />} label="All except" />
                    <FormControlLabel className={classes.field} value="custom" control={<Radio />} label="Custom" />

                </RadioGroup>

                {
                    (this.state[name] === 'custom' || this.state[name] === 'allExcept') &&
                    <div className={classes.field}>
                        <FormLabel className={classes.field} component="legend">Custom field CSS selectors</FormLabel>
                        <TextField
                            className={classes.field}
                            onChange={this.handleCSSSelectorChange.bind(this)}
                            value={this.state.fields}
                            margin="normal"
                            helperText={'Enter CSS selectors here, use semicolon for multiple selectors'}
                            style={{ marginRight: '8px' }}
                        /></div>
                }

            </FormControl>
        </div>
    }
}

export default withStyles(styles)(FormFieldsC);