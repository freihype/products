import { Icon, Tabs } from 'antd';
import * as lodash from 'lodash';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { Configuration, DeviceDto, InDeviceDto } from '../../api2';
import { DeviceService } from '../../services/DeviceService';
import { v4 } from '../../shared/lib/uuid';
import { Socket } from '../../socket';
import { IConsoleHandler, IContentHandler, IDevice } from '../../types';
import { BLOCK_GROUPS, Block, COMMAND_TYPES } from '../../xblox';
import { Command } from '../../xblox/blocks/Command';
import { BlockGrid } from '../../xblox/components/BlockGrid';
import { BlockCommands } from '../../xblox/components/Commands';
import { IBlockCommandHandler, IBlockGridHandler } from '../../xblox/components/types';
import { PropertiesComponent } from '../Properties';
import { Console } from '../widgets/Console/Console';
import { Log } from '../widgets/Log/Log';
import { DeviceToProperties, createHandler, DevicePropertiesGroupMap } from './DeviceProperties';
import { EVENTS, hasFlag, DEVICE_FLAGS, hasFlagHex } from '../../shared';
import { LOGGING_FLAGS, LOGGING_SIGNAL } from '../../shared/enums';
import * as utils from '../../shared/utils';
import { IDefaultProps } from '../../types';
import './index.scss';

const TabPane = Tabs.TabPane;

export type IInstanceView = IDefaultProps & {
    handler?: IContentHandler
    apiConfig?: Configuration
    socket?: Socket
    properties?: () => PropertiesComponent
    model?: IDevice,
    selectedId?: string;
}

export interface IInstanceState {
    model: IDevice;
}

export class DeviceInstance extends React.Component<IInstanceView, IInstanceState>
    implements IBlockCommandHandler, IBlockGridHandler, IConsoleHandler {

    onRun() {
        return this.runBlock();
    }
    getCompletions() {
        const scope = this.state.model.scope;
        const blocks = scope.getBlocks()
        const commands = blocks.filter((b: any) => b.isCommand === true && b.send);
        return commands.map((c: Command) => {
            return {
                label: c.send,
                kind: monaco.languages.CompletionItemKind.Keyword,
                detail: 'Command in ' + c.name,
                insertText: c.send
            }
        })
    }
    public deviceService: DeviceService;
    public device: DeviceDto;
    public commands: BlockGrid;
    public responses: BlockGrid;
    public selectedBlocks: Block[] = [];
    public terminal: Console;
    public log: Log;
    public onSaveBlocks(blocks: Block[]) {

        // self.pro.apiDevicesIdPut(data, current.id);
        const objects = this.state.model.scope.blocksToJson();
        const other = lodash.find(objects, {
            id: blocks[0].id
        })
        const out = {
            ...this.state.model.subject.getValue(),
            blocks: JSON.stringify({ blocks: objects }, null, 2),
            scope: null,
            subject: null
        };
        console.log('save blocks ', out, objects);
        if (!other) {
            console.error('cant find block')
            return;
        }
        this.deviceService.rest.devices.apiDevicesIdPut((out as any) as InDeviceDto, this.state.model.id);

        this.forceUpdate();

    }
    public state: IInstanceState = {
        model: null
    }
    public terminalOptions = { displayHex: false, constructResponse: true };
    constructor(props) {
        super(props);
        this.deviceService = DeviceService.instance();
    }

    onConsoleClear() {
        this.log.clear();
    };

    public onChangeOptions(options: any) {
        this.terminalOptions = options;
    }
    public onConsoleEnter(value: string) {
        const driverInstance = this.state.model.scope.instance;
        // driverInstance.getSendOptions()
        const isScript = this.state.model.scope.isScript(value);
        if (isScript) {
            value = this.state.model.scope.parseExpression(value);
        }
        driverInstance.sendMessage(value, null, driverInstance.id, v4(), false, false, false, []);
        this.log.add({
            message: `Device Console : ${value}`,
            color: 'blue'
        })
    }

    public async runBlock(...rest) {
        return new Promise<any>((resolve, reject) => {
            console.log('run blocks', this.selectedBlocks);
            this.selectedBlocks.forEach((b) => {
                const s = b.scope.solveBlock(b, {}, true, true);
                this.log.add({
                    message: `Device Command : ${(b as Command).send} evaluates to  '${s[0]}'`,
                    color: 'orange'
                })
            })
        });
    }

    public async onBlockSelection(selection: Block[]) {
        return new Promise<any>((resolve, reject) => {
            this.selectedBlocks = selection;
        });
    }
    public _shouldComponentUpdate(props: any) {
        const ret = this.state.model != null;
        return true;
    }
    public async componentWillUnmount() {
        this.props.socket.off(EVENTS.ON_DEVICE_MESSAGE, this.onDeviceMessage);
        this.props.socket.off(EVENTS.ON_DEVICE_ERROR, this.onDeviceError);
    }

    @autobind
    public onDeviceMessage(message: any) {
        const self = this;
        if (!self.log) {
            console.warn('have no log widget!');
            return;
        }
        // console.log('device instance, message : ', message);
        // console.log('message', this.terminalOptions, message);
        const ab: ArrayBuffer = message.data;

        if (!this.terminalOptions.constructResponse && this.terminalOptions.displayHex) {
            const hexStr = utils.bufferToHexString(message.raw.bytes);
            // consoleView.log(hexStr, split, false, types.LOG_OUTPUT.RESPONSE);
            self.log.add({
                message: 'Device Message: ' + hexStr,
                color: 'green'
            })
        }

        if (this.terminalOptions.constructResponse && this.terminalOptions.displayHex) {
            message.messages.forEach((m: string, i: number) => {
                const hexStr = utils.bufferToHexString(message.bytes[i].join(','));
                // consoleView.log(hexStr, split, false, types.LOG_OUTPUT.RESPONSE);
                self.log.add({
                    message: 'Device Message: ' + hexStr,
                    color: 'green'
                })
            });

        }

        if (this.terminalOptions.constructResponse && !this.terminalOptions.displayHex) {
            message.messages.forEach((m: string, i: number) => {
                self.log.add({
                    // message: 'Device Message: ' + m + ' \t(' + i + ' of ' + message.messages.length + ')',
                    message: 'Device Message: ' + m,
                    color: 'green'
                })
            });
        }

        /*
        if (self && self.log) {
            self.log.add({
                message: 'Device Message: ' + message.data,
                color: 'green'
            })
        }*/
    }

    @autobind
    public onDeviceError(message: any) {
        const self = this;
        console.log('device error, message : ', message);
        const ab: ArrayBuffer = message.data;
        const device = message.device;
        const flags: LOGGING_SIGNAL = this.state.model.logging[LOGGING_SIGNAL.DEVICE_ERROR];
        const doConsole = hasFlagHex(flags, LOGGING_FLAGS.DEVICE_CONSOLE);
        if (self && self.log && doConsole) {
            self.log.add({
                message: 'Device Error: ' + message.description,
                color: 'red'
            })
        }
    }
    public async componentDidMount() {
        this.props.socket.on(EVENTS.ON_DEVICE_ERROR, this.onDeviceError);
        const device = await this.deviceService.device(this.props.selectedId);
        this.setState({
            model: device
        });
        if (this.state.model) {
            this.state.model.on(EVENTS.ON_DEVICE_MESSAGE, this.onDeviceMessage);
        }
    }

    render() {
        const model = this.state.model;
        // console.log('render device instance ', model);
        return this.layout();
        /*
        if (model) {
            return (<div style={{ height: '100%' }}> instance2 {this.props.model.name}
            </div>)
        } else {

            // return (<div > no such model : </div>);
        }
        */
    }
    render2() {
        return (<div style={{ height: '100%' }}> instance2 {this.props.model.name}
            {/*
            <XTerm ref={(ref) => { this.xterm = ref }} style={{
                addons: ['fit'],
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                height: '100%'
            }} />
        */}
        </div>)
    }
    @autobind
    onTabChange(key) {
        const p = this.props.route;
        if (key === 'Settings') {
            const properties = this.props.properties();
            properties.next(createHandler, this, this.state.model, DeviceToProperties);
        }

        if (key === 'Logging') {
            const properties = this.props.properties();
            properties.next(createHandler, this, this.state.model, DeviceToProperties, 'logging');
        }
    }
    layout() {
        return (
            // tslint:disable-next-line:no-unused-expression
            <ReflexContainer orientation='horizontal' style={{ height: '1000px' }}>
                <BlockCommands model={null} handler={this} />
                <ReflexElement className='upper-pane DeviceInstance'>
                    <ReflexContainer orientation='vertical' style={{ height: '100%' }}>
                        <ReflexElement>
                            <Tabs
                                defaultActiveKey='1'
                                tabPosition={'left'}
                                onChange={this.onTabChange}
                            >
                                <TabPane tab={<span><Icon type='play' />Commands</span>} key='1'>
                                    <BlockGrid
                                        properties={this.props.properties()}
                                        group={COMMAND_TYPES.BASIC_COMMAND}
                                        ref={(ref) => this.commands = ref}
                                        model={this.state.model}
                                        handler={this}
                                    />
                                </TabPane>
                                <TabPane tab={<span><Icon type='play' />Responses</span>} key='Responses'>
                                    <BlockGrid
                                        properties={this.props.properties()}
                                        group={BLOCK_GROUPS.RESPONSE_BLOCKS}
                                        ref={(ref) => this.responses = ref}
                                        model={this.state.model}
                                        handler={this}
                                    />
                                </TabPane>
                                <TabPane tab='Variables' key='2'>
                                    <BlockGrid properties={this.props.properties()}
                                        group={BLOCK_GROUPS.BASIC_VARIABLES}
                                        ref={(ref) => this.commands = ref}
                                        model={this.state.model}
                                        handler={this}
                                    />
                                </TabPane>
                                <TabPane tab='Settings' key='Settings'>
                                </TabPane>

                                <TabPane tab='Logging' key='Logging'>

                                </TabPane>

                            </Tabs>
                        </ReflexElement>

                    </ReflexContainer>

                </ReflexElement>

                <ReflexSplitter />
                <ReflexElement className='right-pane'
                    minSize='150'
                    maxSize='800'>
                    <Log ref={(ref) => this.log = ref} />
                </ReflexElement>

                <ReflexSplitter />

                <ReflexElement className='right-pane'
                    minSize='250'
                    maxSize='800'>
                    <Console handler={this} ref={(ref) => this.terminal = ref} />

                </ReflexElement>

            </ReflexContainer >
        )
    }
}
