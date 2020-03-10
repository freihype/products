import { IconButton, Toolbar, Typography, withStyles } from '@material-ui/core';
import CancelLeftIcon from '@material-ui/icons/Cancel';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import * as React from "react";

const styles = theme => ({
    head: {
        ...theme.mixins.gutters(),
    },
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.paper
    },
    grow: {
        flexGrow: 1,
    }
});

class NavbarC extends React.PureComponent<any, any> {
    render() {
        const { classes, handler, title, children } = this.props;
        return <div className={classes.root}>
            <Toolbar disableGutters={true}>
                <IconButton onClick={() => handler.onCancel()}>
                    <ChevronLeftIcon />
                </IconButton>
                <Typography className={classes.head} variant={'subtitle1'} color={'primary'} >{title}</Typography>
                <div className={classes.grow} />
                <div className={classes.grow} />
                {children}
                <IconButton onClick={() => handler.onCancel()}>
                    <CancelLeftIcon />
                </IconButton>
            </Toolbar>
        </div>
    }
}

export const Navbar = withStyles(styles)(NavbarC);