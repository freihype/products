import * as React from "react";
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { Input, TextField } from "@material-ui/core";

export class Text extends React.Component<any, any> {

    constructor(props) {
        super(props);
        this.state = {
            [props.name]: props.value
        }
    }
    handleChange = name => event => {
        this.setState({ [name]: event.target.value });
        this.props.owner.onChange(name, event.target.value);
    };

    render() {
        const { name, label, value, help } = this.props;
        return <FormGroup row>
            <FormControlLabel
                labelPlacement="end"
                control={
                    <TextField
                        onChange={this.handleChange(name)}
                        value={this.state[name]}
                        margin="normal"
                        helperText={help}
                        style={{ marginRight: '8px' }}
                    />
                }
                label={label}
            />
        </FormGroup>
    }
}