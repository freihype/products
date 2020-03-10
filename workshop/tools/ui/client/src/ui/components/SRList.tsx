import { Button, Divider, Drawer, Grid, Toolbar } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import FavoriteIcon from '@material-ui/icons/Favorite';
import FilterIcon from '@material-ui/icons/FilterList'
import ReloadIcon from '@material-ui/icons/Sync';
import PlayerIcon from '@material-ui/icons/PlayArrowOutlined';
import * as get from 'get-value';
import * as React from "react";
import { FilterTypeMap, FilterLabelMap, columns, getColumn, capitalize, SessionValuePaths, firstOf, EventType } from '../../shared';
import { remove } from '../../shared';
import "../assets/css/App.css";
import { SessionAPI } from './Player/SessionAPI';
import { filteredRows, operationPredicates } from './SessionTable/compute';
import { SessionFilters } from './SessionTable/SessionFilter';
import { SessionTable } from './SessionTable/SessionTable';
import { SessionSearchInput } from './SessionTable/Search';
import { keyOf } from '../../lib';
import { difference, intersection } from 'ramda';
import { SessionPlayer } from './Player2/SessionPlayer';
import { Media } from './Player2';
import { Filter, PropertyFilter } from './SessionTable/types';
import { toFilterExpression } from './SearchHandler';
import * as classNames from 'classnames';
import { SessionActions } from './SessionActions';
import { getConfig } from '../config';
function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

const drawerWidth = 400;
const colors = {
    "primary": { "light": "#7986cb", "main": "rgba(192, 192, 192, 1)", "dark": "rgba(205, 205, 205, 1)", "contrastText": "#fff" }, "secondary": { "light": "#ff4081", "main": "rgba(208, 2, 27, 1)", "dark": "#c51162", "contrastText": "#fff" }, "error": { "light": "#e57373", "main": "#f44336", "dark": "#d32f2f", "contrastText": "#fff" }, "text": { "primary": "rgba(175, 175, 175, 0.87)", "secondary": "rgba(255, 255, 255, 0.54)", "disabled": "rgba(168, 24, 24, 0.38)", "hint": "rgba(0, 0, 0, 0.38)" }
}
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
        button: {
            margin: theme.spacing.unit
        },
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
        }
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
        tab: 0,
        open: false,
        sessions: [],
        filters: [],
        selectedProp: null,
        searchValue: '',
        sticky: false,
        selectedSessions: [],
        config: {
            root: getConfig('root', 'https://nowproject.eu/wordpress/index.php')
        }
    };
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
    async init() {
        this.all = await SessionAPI.sessions();
        this.setState({ sessions: this.all.sessions });
    }
    componentWillMount() {
        this.init();
    }
    createFilter() {
        this.toggleDrawer(true);
    }
    componentDidMount() {
        document.getElementById('loadingWrapper').style.display = 'none';
    }

    handleTabChange = (event, tab) => {
        this.setState({ tab });
    };

    onApplyFilter(prop, filter) {
        const rows = this.state.sessions;
        const type = FilterTypeMap[prop];
        const filterExpression = {
            columnName: prop,
            value: type === 'number' ? parseInt(filter.value) : filter.value
        };
        const getCellValue = (row, columnName) => {
            const ret = get(row, columnName, { default: row[columnName] });
            return ret;
        };
        const filterFn = operationPredicates[filter.op];
        const getColumnPredicate = () => (value, filter) => filterFn(value, filter);
        const filtered = filteredRows(rows, filterExpression, getCellValue, getColumnPredicate);
        console.log('on created filter ' + prop, filtered, filter);
        this.setState({
            sessions: filtered.rows || []
        });
    }
    onCreatedFilter(prop, filter) {
        console.log('on created filter ' + prop, filter);
        const filters = this.state.filters;
        const propEq = (a, b) => a === b;
        const has = (filters, prop, filter) => filters.find((f) => propEq(prop, f.prop));
        const is = has(filters, prop, filter);
        if (!is) {
            filters.push({ prop, filter });
        } else {
            is.filter.op = filter.op;
            is.filter.value = filter.value;
        }
        this.setState({
            filters: filters
        });
    }
    applyFilters(extra?, filtersIn?) {
        let filters_: PropertyFilter[] = filtersIn || this.state.filters;
        let filters: any[] = [];
        filters_.forEach((f) => {
            filters.push(f);
            if (f.filter.next) {
                filters = filters.concat(f.filter.next.map((n) => {
                    return {
                        prop: f.prop,
                        filter: n
                    }
                }));
            }
        });

        const expr = toFilterExpression(filters_);


        let filterExpression3 = {
            operator: 'and',
            filters: [
                {
                    operator: 'or',
                    filters:
                        [
                            {
                                "columnName": "viewCount",
                                "value": 4,
                                "op": "greaterThan"
                            },
                            {
                                "columnName": "viewCount",
                                "value": 2,
                                "op": "lessThan"
                            }
                        ]
                },
                {
                    operator: 'and',
                    filters:
                        [
                            {
                                "columnName": "errors",
                                "value": 5,
                                "op": "lessThan"
                            }
                        ]
                }
            ]
        };

        let sessions = [...this.all.sessions];
        let out = [];
        if (!filtersIn) {
            out = sessions;
        }

        const filterExpression = {
            operator: 'and',
            filters: []
        }
        const getCellValue = (row, columnName) => {
            const ret = get(row, columnName, { default: row[columnName] });
            return ret;
        };
        const getColumnPredicate = () => (value, filter) => {
            const filterFn = operationPredicates[filter.op];
            return filterFn(value, filter);
        }
        /*
                filters.forEach((f) => {
                    const type = FilterTypeMap[f.prop];
                    const filter = f.filter;
                    const filterExpression2 = {
                        columnName: f.prop,
                        value: type === 'number' ? parseInt(filter.value) : filter.value,
                        op: filter.op
                    };
                    filterExpression.filters.push({
                        columnName: f.prop,
                        value: type === 'number' ? parseInt(filter.value) : filter.value,
                        op: filter.op
                    })
                    if (filtersIn) {
                        let found = filteredRows(sessions, filterExpression, getCellValue, getColumnPredicate).rows;
                        if (found.length) {
                            out = out.concat(found);
                        }
                    } else {
                        // out = found;
                        // out = filteredRows(out, filterExpression, getCellValue, getColumnPredicate).rows;
                    }
                });
                */

        out = filteredRows(out, expr, getCellValue, getColumnPredicate).rows;
        console.log('filtered : ', { out, filters, expr });
        let searchFilterNames = filters.map((f) => FilterLabelMap[f.prop] || capitalize(f.prop));
        this.setState({
            sessions: out,
            // open: false,
            selectedProp: null,
            searchValue: searchFilterNames.length ? `Active Filter (${searchFilterNames.join(',')})` : null,
            ...extra
        })

    }
    applyFiltersBak(extra, filtersIn?) {
        const filters = filtersIn || this.state.filters;
        let sessions = [...this.all.sessions];
        let out = [];
        if (!filtersIn) {
            out = sessions;
        }

        filters.forEach((f) => {
            const type = FilterTypeMap[f.prop];
            const filter = f.filter;
            const filterExpression = {
                columnName: f.prop,
                value: type === 'number' ? parseInt(filter.value) : filter.value
            };
            const getCellValue = (row, columnName) => {
                const ret = get(row, columnName, { default: row[columnName] });
                return ret;
            };
            const filterFn = operationPredicates[filter.op];
            const getColumnPredicate = () => (value, filter) => filterFn(value, filter);
            if (filtersIn) {
                let found = filteredRows(sessions, filterExpression, getCellValue, getColumnPredicate).rows;
                if (found.length) {
                    out = out.concat(found);
                }
            } else {
                // out = found;
                out = filteredRows(out, filterExpression, getCellValue, getColumnPredicate).rows;
            }
        });
        let searchFilterNames = filters.map((f) => FilterLabelMap[f.prop] || capitalize(f.prop));
        this.setState({
            sessions: out,
            open: false,
            selectedProp: null,
            searchValue: searchFilterNames.length ? `Active Filter (${searchFilterNames.join(',')})` : null,
            ...extra
        })

    }
    onRemovedFilter(prop, filter) {
        remove(this.state.filters, filter);
        this.setState({
            filters: this.state.filters
        });
        this.applyFilters();
    }
    onSearchSuggestion(val) {
        console.log('on search suggestion ' + val, val);
        this.setState({
            open: true,
            selectedProp: val.value
        })
    }
    onSearchClear() {
        if (this.all.sessions) {
            this.state.filters = [];
            this.applyFilters({
                selectedProp: null,
                filters: [],
                searchValue: null,
                sessions: [...this.all.sessions]
            });
        }
    }
    onFilterSticky(sticky) {
        this.setState({
            sticky: sticky
        })
        /*

        if (wasOpen) {
            this.setState({
                stickey: sticky,
                open: sticky ? false : true
            })
        } else {

        }
        if (sticky) {
            setTimeout(() => {
                this.setState({
                    open: true
                })
            }, 10)
        } else {
            if (wasOpen) {
                this.setState({
                    //  open: false
                })
            }
        }
        */
    }
    onSearchInput(val) {
        if (!this.table) {
            return;
        }
        if (val.length === 0) {
            return this.onSearchClear();
        }
        const state = this.table.state;
        const hidden = [...state.hiddenColumnNames || []];
        const all = state.columns.map(c => c.name);
        // const visibleColumns = all.filter((c) => hidden.indexOf(c) === -1)
        const visibleColumns2 = intersection(all, hidden);
        const visibleColumns = difference(all, hidden);

        let searchFilterExpression = function searchFilterExpression(searchValue, columns, filterExpression) {
            let filters = columns.map(function (_ref) {
                return { columnName: _ref, value: searchValue };
            });
            let selfFilterExpression = { operator: 'or', filters: filters };
            if (!filterExpression) {
                return selfFilterExpression;
            }
            return {
                operator: 'and',
                filters: [filterExpression, selfFilterExpression]
            };
        };
        let filters = visibleColumns.map((c) => {
            return {
                prop: SessionValuePaths[c] || c,
                filter: {
                    op: 'contains',
                    value: val
                }
            }
        })

        if (val.length < 3) {
            return;
        }
        this.applyFilters({
            searchValue: null
        }, filters);
        /*
        const filterExpressionComputed = (
            { filterExpression, columns },
        ) => searchFilterExpression(val, columns, filterExpression);
        */


        console.log('on search input ' + val, visibleColumns, this.table);


    }
    onPlayerReady(media: any) {
        const player = media.player;
        const events = media.events.events;
        const view = firstOf(EventType.VIEW, events);
        const next = ((view.time - media.events.start) + 100) / 1000;
        console.log('on player ready : ', media, view, player.renderer['time'], next);
        media.seekTo(next);
        /*
        player.renderer['time'] = (view.time - media.events.start) + 100;
        console.log(player.renderer['time']);
        player.renderer.play();
        player.renderer.pause();
        */

    }
    onSelected(selectedSessions) {
        this.setState({ selectedSessions: selectedSessions });
    }
    async deleteSessions() {
        console.log('delete sessions : ', this.state.selectedSessions);
        await SessionAPI.removeSession(this.state.selectedSessions.map((s) => s.session).join(','));
        this.setState({ selectedSessions: [] });
        this.table.setState({ selection: [] });
        await this.init();
    }
    onClose() {
        this.setState({
            open: false,
            sticky: false
        })
    }
    render() {
        const { classes } = this.props;
        const { open, sticky, selectedSessions } = this.state;

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
                            indicatorColor="primary"
                            textColor="primary">
                            <Tab label="Recordings" icon={<PlayerIcon />} />
                            <Tab label="Item Two" icon={<FavoriteIcon />} />
                        </Tabs>

                        {this.state.tab === 0 &&
                            <TabContainer>
                                <Grid
                                    container
                                    spacing={24}
                                    direction="column"
                                    alignItems="stretch"
                                    justify="flex-end"
                                    style={{}}>
                                    <Grid className={classes.gridItem} item xs={'auto'}>
                                        <Toolbar disableGutters={false}>
                                            <SessionSearchInput
                                                onSuggestion={this.onSearchSuggestion.bind(this)}
                                                onChange={this.onSearchInput.bind(this)}
                                                onClear={this.onSearchClear.bind(this)}
                                                classes={classes}
                                                defaultValue={this.state.searchValue}
                                            />
                                            <div className={classes.grow} />
                                            <div className={classes.grow} />

                                            <Button className={classes.button} onClick={this.createFilter.bind(this)} size={"small"} color={'secondary'} variant={'contained'}>
                                                <FilterIcon />
                                                Filter
                                            </Button>
                                            <Button className={classes.button} onClick={this.init.bind(this)} size={"small"} color={'secondary'} variant={'contained'}>
                                                <ReloadIcon />
                                                Reload
                                            </Button>
                                        </Toolbar>
                                    </Grid>
                                </Grid>

                                <Divider />

                                <SessionTable onSelected={this.onSelected.bind(this)} ref={(ref) => this.table = ref} sessions={this.state.sessions || []} selected={this.props.selected}></SessionTable>
                                {
                                    selectedSessions.length ? <SessionActions handler={this} /> : ''
                                }

                            </TabContainer>}

                        {this.state.tab === 1 && <TabContainer>
                            <SessionPlayer showControls={false} showChart={false} owner={this} autoPlay={false} session={this.props.selected} {...this.props} />
                        </TabContainer>}
                    </main>

                    <Drawer
                        variant={this.state.sticky ? 'persistent' : 'temporary'}
                        open={this.state.open}
                        onClose={() => this.toggleDrawer(false)}
                        className={classes.drawer}
                        classes={{ paper: classes.drawerPaper }}
                        anchor="right">
                        <div className={classes.toolbar} />

                        {/**
                        <Button onClick={this.applyFilters.bind(this)} size={"small"} color={'secondary'} variant={'contained'}>
                            <FilterIcon />
                            Apply
                        </Button>
                        **/}

                        <SessionFilters onFilterSticky={(sticky) => this.onFilterSticky(sticky)}
                            config={this.state.config}
                            ref={(ref) => this.filter = ref}
                            selectedProp={this.state.selectedProp}
                            values={this.all.values}
                            filters={this.state.filters}
                            sticky={this.state.sticky}
                            handler={this} />

                    </Drawer>
                </div>
            </MuiThemeProvider >
        );
    }
}
export const ListApp = (withStyles(styles, { withTheme: true })(AppC));
export interface AppProps {
    view: string;
    selected: string;
}