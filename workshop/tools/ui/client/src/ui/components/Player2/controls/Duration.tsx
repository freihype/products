import * as React from 'react'
import { withMediaProps } from '../decorators/with-media-props'
import { formatTime } from '../utils/format-time'
import { Typography } from '@material-ui/core';

class Duration extends React.Component<any, any> {
  shouldComponentUpdate({ media }) {
    return this.props.media.duration !== media.duration
  }

  render() {
    const { media } = this.props
    return (
      <Typography color={"inherit"}>
        {formatTime(media.duration)}
      </Typography>
    )
  }
}

export default withMediaProps(Duration)
