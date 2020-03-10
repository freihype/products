import { Block } from './Block';
import { extend } from 'lodash';
export const createBlock = (proto, ctorArgs, publish) => {
    //complete missing arguments:
    Block.prototype.prepareArgs(ctorArgs);
    const block = new proto(ctorArgs);
    delete block.ctrArgs;
    extend(block, ctorArgs);
    try {
        if (block && block.init) {
            block.init();
        }
        //add to scope
        if (block.scope) {
            block.scope.registerBlock(block, publish);
        } else {
            console.error('block has no scope : ', block.id);
        }

    } catch (e) {
        console.error('error creating block', e);
    }
    console.log('created block : ' + block.name + ' ' + block.id);
    return block;
};
