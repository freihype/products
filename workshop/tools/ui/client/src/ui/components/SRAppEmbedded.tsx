import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import { createMuiTheme, MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import { fade } from '@material-ui/core/styles/colorManipulator';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as React from "react";
import { SizeMe } from 'react-sizeme';
import "../assets/css/App.css";
import { SessionEvents } from './Events/List';
import { SessionInfo } from './Player/SessionInfo';
import { SessionList } from './Player/SessionList';
import { ViewContainer } from "./ViewContainer";
import { replaceUrlParam } from '../../lib/url';
const ref = (session) => session.start + 'x' + session.end + 'x' + session.session;
const index = (selected: string, sessions: any) => {
    const refs = sessions.map(ref);
    return refs.indexOf(selected);
}
const drawerWidth = 300;
const theme2 = createMuiTheme({
    palette: {
        type: location.href.indexOf('dark') !== -1 ? 'dark' : 'light', // Switching the dark mode on is a single property value change.
    },
    typography: {
        useNextVariants: true,
    },
});

const styles = theme => ({
    root: {
        display: 'flex',
    },
    grow: {
        flexGrow: 1,
    },
    drawer: {
        [theme.breakpoints.up('sm')]: {
            width: drawerWidth,
            flexShrink: 0,
        }
    },
    drawerNone: {
        [theme.breakpoints.up('sm')]: {
            width: 0
        },
    },
    appBar: {
        marginLeft: drawerWidth,
        backgroundColor: 'rgba(80,80,80,1)',
        [theme.breakpoints.up('sm')]: {
            // width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    appBarFull: {
        backgroundColor: 'rgba(120,120,120,1)',
        [theme.breakpoints.up('sm')]: {

        },
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginRight: 10,
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    // toolbar: theme.mixins.toolbar,
    ListItem: {
        padding: 8
    },
    drawerPaper: {
        width: drawerWidth,
        height: '100%',
        overflow: 'auto'
    },
    content: {
        flexGrow: 1,
        padding: 0,
        width: '100%'
    },
    fullscreenButton: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        width: '100%',
        // color: theme.palette.common.white,
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing.unit,
            width: 'auto',
        },
    }
});
/*
<div className={!fullscreen ? classes.appBar : classes.appBarFull}>
<Toolbar>
    <IconButton onClick={() => { }}>
        {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </IconButton>
    <IconButton
        color="inherit"
        aria-label="Open drawer"
        onClick={this.handleDrawerToggle}
        className={classes.menuButton}
    >
        <MenuIcon />
    </IconButton>
    <Typography variant="h6" color="inherit" noWrap> Session Player
        <Typography color="inherit" noWrap> {this.state.toolbarTitle || ''}</Typography>
    </Typography>

    <div className={classes.grow} />

    <ToggleButtonGroup className={classes.fullscreenButton} value={true} exclusive onChange={this.handleFullscreenToggle}>
        <ToggleButton value="true">
            {
                !this.state.fullscreen ? <Link to={{ search: location.search, state: { fullscreen: true }, hash: '#fullscreen' }}>
                    <FullScreenIcon color={'action'} />
                </Link>
                    :
                    <Link to={{ search: location.search, state: { fullscreen: false }, hash: '' }}>
                        <FullScreenExitIcon color={'secondary'} />
                    </Link>
            }
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-crosshairs'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-cut'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-paste'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-save'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-file'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-share'} color={'action'} />
        </ToggleButton>

        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-download'} color={'action'} />

        </ToggleButton>
        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-cogs'} color={'action'} />
        </ToggleButton>
        <ToggleButton value="true">
            <Icon style={{ fontSize: 16 }} className={'fa fa-sign-out-alt'} color={'action'} />
        </ToggleButton>
    </ToggleButtonGroup>

</Toolbar>
</div>
*/

class AppC extends React.Component<any, any> {
    state = {
        mobileOpen: false,
        events: {},
        player: null,
        selected: null,
        fullscreen: null,
        toolbarTitle: '',
        sessions: []
    };
    navigation: any;
    navigationRoot: HTMLDivElement;
    mainRoot: HTMLElement;
    appBar: any;
    sessions: any;
    resize = () => this.forceUpdate()
    componentDidMount() {
        document.getElementById('loadingWrapper').style.display = 'none';
        window.addEventListener('resize', this.resize)
    }

    handleDrawerToggle = () => {
        this.setState(state => ({ mobileOpen: !state.mobileOpen }));
    };

    handleFullscreenToggle = (val) => {
        const { hash } = this.props;
        if (this.state.fullscreen === null) {
            this.state.fullscreen = !!('fullscreen' in hash)
        }
        this.setState(state => ({ fullscreen: !this.state.fullscreen }));
    };

    calcDimensions() {

    }
    componentWillReceiveProps(nextProps) {
        // console.log('receive props ', nextProps);
    }
    onNext() {

        let cIndex = index(this.props.selected, this.sessions.sessions);
        if (cIndex + 1 < this.sessions.sessions.length) {
            ++cIndex;
        } else {
            cIndex = 0;
        }
        const next = ref(this.sessions.sessions[cIndex]);
        location.href = replaceUrlParam('selected', next);

    }
    onPrev() {
        let cIndex = index(this.props.selected, this.sessions.sessions);
        if (cIndex - 1 > 0) {
            --cIndex;
        } else {
            cIndex = this.sessions.sessions.length - 1;
        }
        const next = ref(this.sessions.sessions[cIndex]);
        location.href = replaceUrlParam('selected', next);
    }

    render() {
        const { classes, theme, hash } = this.props;

        let fullscreen;
        if (this.state.fullscreen == null) {
            fullscreen = this.state.fullscreen = !!('fullscreen' in hash)
        } else {
            fullscreen = this.state.fullscreen;
        }

        let height = window.innerHeight;

        const drawer = (
            <div style={{ height: height + 'px' }} id="drawerRoot" ref={(ref) => this.navigationRoot = ref}>
                <ExpansionPanel defaultExpanded={true}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} >
                        <Typography className={classes.heading}>Info</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{ padding: 8 }}>
                        <SessionInfo key={'sessionInfo'} events={this.state.events}
                        />
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider />

                <ExpansionPanel defaultExpanded={true}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} >
                        <Typography className={classes.heading}>User Sessions</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{ padding: 0 }}>
                        <SessionList
                            key={'sessionList'}
                            selected={this.props.selected}
                            visitor={this.props.visitor}
                            onSessions={(sessions) => {
                                this.sessions = sessions;
                            }}
                            onChange={(session) => {
                                this.setState({
                                    selected: session
                                })
                            }}  >
                        </SessionList>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider />

                <ExpansionPanel defaultExpanded={true} >
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} >
                        <Typography className={classes.heading}>Events</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{ padding: 0 }}>

                        <SessionEvents owner={this} player={this.state.player} events={this.state.events} ref={(ref) => this.navigation = ref} />

                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider />

            </div>
        );
        return (
            <MuiThemeProvider theme={theme2}>
                <div className={classes.root}>
                    <CssBaseline />
                    {
                        <nav className={!fullscreen ? classes.drawer : classes.drawerNone}>
                            {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                            <Hidden smUp implementation="css">
                                <Drawer
                                    className={'drawerRelative'}
                                    container={this.props.container}
                                    variant="temporary"
                                    anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                                    open={this.state.mobileOpen}
                                    onClose={this.handleDrawerToggle}
                                    classes={{
                                        paper: !fullscreen ? classes.drawerPaper : classes.drawerNone,
                                    }}
                                    ModalProps={{
                                        keepMounted: false, // Better open performance on mobile.
                                    }}
                                >
                                    {drawer}
                                </Drawer>
                            </Hidden>
                            <Hidden xsDown implementation="css">
                                <Drawer
                                    className={'drawerRelative'}
                                    classes={{
                                        paper: !fullscreen ? classes.drawerPaper : classes.drawerNone,
                                    }}
                                    variant="permanent"
                                    open
                                >
                                    {drawer}

                                </Drawer>
                            </Hidden>
                        </nav>
                    }

                    <main className={classes.content} ref={(ref) => this.mainRoot = ref}>
                        <div className={classes.toolbar} />
                        <SizeMe monitorHeight={true}>
                            {({ }) => {
                                return <ViewContainer
                                    view={this.props.view}
                                    visitor={this.props.visitor}
                                    selected={this.state.selected ? this.state.selected : this.props.selected}
                                    owner={this}
                                />
                            }}
                        </SizeMe>
                    </main>

                </div>
            </MuiThemeProvider>
        );
    }
}
export const App = (withStyles(styles, { withTheme: true })(AppC));

export interface AppProps {
    view: string;
    selected: string;
    visitor: string;
}