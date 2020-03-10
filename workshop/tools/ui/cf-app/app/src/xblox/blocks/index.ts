import { Block } from '../model/Block';
import { Variable } from '../model/Variable';
import { Command } from './Command';
import { RunScript } from './RunScript';
export const BlockMap = {
    'xcf/model/Variable': Variable,
    'xcf/model/Command': Command,
    'xblox/model/code/RunScript': RunScript,
    '*': Block
}
