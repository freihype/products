import { Block } from '../';
export type Run = (model: Block) => Promise<any>;

export interface IBlockCommandHandler {
    runBlock: Run;
}

export interface IBlockGridHandler {
    onBlockSelection: (selection: Block[]) => void;
    onSaveBlocks: (selection: Block[]) => void;
    onRun: () => void;
}
