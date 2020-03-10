import * as React from "react";
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

export class Toggle extends React.Component<any, any> {

    constructor(props) {
        super(props);
        this.state = {
            [props.name]: props.value
        }
    }
    handleChange = name => event => {
        this.setState({ [name]: event.target.checked });
        this.props.owner.onChange(name, event.target.checked);
    };

    render() {
        const { name, label } = this.props;
        // abelPlacement="start"
        return <FormGroup row>
            <FormControlLabel
                control={
                    <Switch
                        checked={this.state[name]}
                        onChange={this.handleChange(name)}
                        value={name}
                        color="primary"
                    />
                }
                label={label}
            />
        </FormGroup>
    }
}