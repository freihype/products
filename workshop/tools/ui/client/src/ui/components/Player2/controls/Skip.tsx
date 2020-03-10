import * as React from 'react'
import { withMediaProps } from '../decorators/with-media-props'
import Transition from 'react-motion-ui-pack'
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
class Skip extends React.Component<any, any> {
  state = { checkedA: true }
  _handlePlayPause = () => {
    this.props.media.playPause()
  }

  render() {
    const { media: { isPlaying }, className } = this.props;
    // console.log('render : ', this.props);
    return (
      <FormGroup row style={{ color: 'white' }}>
        <FormControlLabel style={{ color: 'white' }}
          labelPlacement="start"
          control={
            <Switch
              checked={this.state.checkedA}
              onChange={this.handleChange('checkedA')}
            />
          }
          label={<span style={{ color: 'white' }}>Skip Inactivity</span>}
        />
      </FormGroup>
    )
  }
  handleChange = name => event => {
    this.setState({ [name]: event.target.checked });
    this.props.media.skipInactivity(event.target.checked);
  };
}

export default withMediaProps(Skip)
