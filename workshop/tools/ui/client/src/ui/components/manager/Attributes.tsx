import * as React from "react";

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { withStyles, TextField } from "@material-ui/core";
const styles = theme => ({
    root: {
        display: 'flex',
    },
    field: {
        paddingLeft: theme.spacing.unit * 10
    },
    formControl: {
        margin: theme.spacing.unit * 10,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    },
});

export class AttributesC extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            value: props.config.filter.attributes
        }
    }
    handleCSSSelectorChange(event) {
        this.setState({ value: event.target.value });
        this.props.owner.onChange('attributes', event.target.value);
    };
    render() {
        const { classes, value } = this.props;
        return <div>
            <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel focused={true} component="legend">Filter attribute values</FormLabel>
                <TextField
                    className={classes.field}
                    onChange={this.handleCSSSelectorChange.bind(this)}
                    value={this.state.value}
                    margin="normal"
                    helperText={'Enter here attribute names, use semicolon for attributes selectors'}
                    style={{ marginRight: '8px' }}
                />
            </FormControl>
        </div>
    }
}

export default withStyles(styles)(AttributesC);