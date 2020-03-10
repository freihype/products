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

export class ContentC extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value
        }
    }
    handleCSSSelectorChange(event) {
        this.setState({ value: event.target.value });
        this.props.owner.onChange('content', event.target.value);
    };
    render() {
        const { classes } = this.props;
        const { value } = this.state;
        return <div>
            <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel focused={true} component="legend">Filter content selectors</FormLabel>
                <TextField
                    className={classes.field}
                    onChange={this.handleCSSSelectorChange.bind(this)}
                    value={value}
                    margin="normal"
                    helperText={'Enter CSS selectors here, use semicolon for multiple selectors'}
                    style={{ marginRight: '8px' }}
                />
            </FormControl>
        </div>
    }
}

export default withStyles(styles)(ContentC);