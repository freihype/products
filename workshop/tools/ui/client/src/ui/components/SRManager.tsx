import { Divider, Drawer, Grid, Button } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import FilterIcon from '@material-ui/icons/FilterList';
import Settings from '@material-ui/icons/PowerSettingsNew';
import SettingsAdvanced from '@material-ui/icons/SettingsEthernet';
import * as React from "react";
import { SessionTable } from './SessionTable/SessionTable';
import * as classNames from 'classnames';
import { getConfig } from '../config';
import { SettingsGeneral } from './manager/SettingsGeneral';
import { SettingsFilter } from './manager/SettingsFilter';
import blue from '@material-ui/core/colors/blue';
import { SessionAPI } from './Player/SessionAPI';
export interface ManagerAppProps {
    view: string;
    selected: string;
}
function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

const drawerWidth = 400;
const theme2 = createMuiTheme({
    palette: {
        type: location.search.indexOf('dark') !== -1 ? 'dark' : 'light', // Switching the dark mode on is a single property value change.
    },
    typography: {
        useNextVariants: true
    },
    shape: {
        borderRadius: 0
    },
    spacing: {
        unit: 2
    },
    props: {
        MuiButtonBase: {
            // The properties to apply
            disableRipple: true, // No more ripple, on the whole application 💣!
        },
    },
    transitions: {
        // So we have `transition: none;` everywhere
        create: () => 'none',
    },
});
if (location.search.indexOf('dark') !== -1) {
    // theme2.palette = { ...theme2.palette, ...colors }
}
const styles = theme => {
    return {
        root: {
            display: 'flex'
        },
        grow: {
            flexGrow: 1,
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
            /*
            [theme.breakpoints.up('sm')]: {
                width: drawerWidth,
                flexShrink: 0,
            }
            */
        },
        drawerPaper: {
            width: drawerWidth,
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
        ListItem: {
            padding: 8
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing.unit * 3
            // marginLeft: -drawerWidth,
        },
        contentShift: {
            marginLeft: 0
        },
        button: {
            margin: theme.spacing.unit,
            color: blue[900]
        },
    }
};

class AppC extends React.Component<any, any> {
    state = {
        mobileOpen: false,
        events: {},
        player: null,
        selected: null,
        fullscreen: null,
        toolbarTitle: '',
        tab: 1,
        open: false,
        sessions: [],
        filters: [],
        selectedProp: null,
        searchValue: '',
        sticky: false,
        selectedSessions: [],
        config: null
    };
    constructor(props) {
        super(props);
        this.state.config = props.config || {
            enabled: true,
            enabledMobile: true,
            root: getConfig('root', 'https://nowproject.eu/wordpress/index.php'),
            filter: {
                formFields: 'all',
                fields: '',
                content: '',
                attributes: '',
                ip: false,
                location: false
            }
        };
    }
    navigation: any;
    navigationRoot: HTMLDivElement;
    mainRoot: HTMLElement;
    appBar: any;
    all: any = {}
    table: SessionTable;
    filter: any;
    toggleDrawer(open) {
        this.setState({
            open: open
        });
    }
    createFilter() {
        this.toggleDrawer(true);
    }
    componentDidMount() {
        document.getElementById('loadingWrapper').style.display = 'none';
        document.title = "Session Inspector Settings";
    }

    handleTabChange = (event, tab) => {
        this.setState({ tab });
    };
    onChanged(name, value) {

    }
    onClose() {
        this.setState({
            open: false,
            sticky: false
        })
    }
    onSave() {
        console.log('props save', this.state.config);
        SessionAPI.configSave(this.state.config);
    }
    render() {
        const { classes } = this.props;
        const { open, config } = this.state;
        return (
            <MuiThemeProvider theme={theme2}>
                <div className={classes.root}>
                    <CssBaseline />
                    <main className={classNames(classes.content, {
                        [classes.contentShift]: open
                    })}
                        ref={(ref) => this.mainRoot = ref}>
                        <Tabs
                            value={this.state.tab}
                            onChange={this.handleTabChange}
                            scrollButtons="on"
                            textColor="primary">
                            <Tab label="General" icon={<Settings />} />
                            <Tab label="Filtering" icon={<FilterIcon />} />
                            <Tab label="Advanced" icon={<SettingsAdvanced />} />
                        </Tabs>

                        {this.state.tab === 0 && <TabContainer>
                            <Grid
                                container
                                spacing={24}
                                direction="column"
                                alignItems="stretch"
                                justify="flex-end"
                                style={{}}>
                                <Grid className={classes.gridItem} item xs={'auto'}>
                                    <SettingsGeneral config={config} owner={this} />
                                </Grid>
                            </Grid>

                        </TabContainer>}

                        {this.state.tab === 1 && <TabContainer>
                            <Grid
                                container
                                spacing={24}
                                direction="column"
                                alignItems="stretch"
                                justify="flex-end"
                                style={{}}>
                                <Grid className={classes.gridItem} item xs={'auto'}>
                                    <SettingsFilter config={config} owner={this} />
                                </Grid>
                            </Grid>
                        </TabContainer>}

                        <Button
                            key={'saveAsBtn'}
                            onClick={() => { this.onSave() }}
                            size={"small"}
                            className={classes.button}
                            variant={'outlined'}>
                            Save
                        </Button>

                    </main>

                    <Drawer
                        variant={this.state.sticky ? 'persistent' : 'temporary'}
                        open={this.state.open}
                        onClose={() => this.toggleDrawer(false)}
                        className={classes.drawer}
                        classes={{ paper: classes.drawerPaper }}
                        anchor="right">
                        <div className={classes.toolbar} />

                    </Drawer>
                </div>
            </MuiThemeProvider >
        );
    }
}
export const ManagerApp = (withStyles(styles, { withTheme: true })(AppC));
