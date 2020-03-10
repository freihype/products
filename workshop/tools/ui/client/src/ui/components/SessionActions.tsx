import { Button, Grid, Toolbar } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import RemoveIcon from '@material-ui/icons/DeleteForever';
import PlayIcon from '@material-ui/icons/PlayArrow';
import * as React from "react";

const styles = (theme) => {
    return {
        root: {
            display: 'flex'
        },
        grow: {
            flexGrow: 1,
        },
        button: {
            margin: theme.spacing.unit * 3
        }
    }
};
class SessionActionsC extends React.Component<any, any> {
    deleteSelection() {
        this.props.handler.deleteSessions();
    }
    playSelection() {
        // this.props.handler.playSessions();
    }
    render() {
        const { classes } = this.props;
        return <Grid
            container
            spacing={24}
            direction="column"
            alignItems="stretch"
            justify="flex-end"
            style={{}}>
            <Grid className={classes.gridItem} item xs={'auto'}>
                <Toolbar disableGutters={false}>
                    <Button className={classes.button} onClick={this.deleteSelection.bind(this)} size={"small"} color={'secondary'} variant={'outlined'}>
                        <RemoveIcon />
                        Delete
                    </Button>
                    <Button className={classes.button} onClick={this.playSelection.bind(this)} size={"small"} color={'secondary'} variant={'outlined'}>
                        <PlayIcon />
                        Play
                    </Button>
                </Toolbar>
            </Grid>
        </Grid>
    }
}
export const SessionActions = (withStyles(styles, { withTheme: true })(SessionActionsC));