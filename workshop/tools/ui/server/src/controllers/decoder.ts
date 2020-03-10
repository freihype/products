// import * as Comlink from 'comlinkjs';

const ESCAPE_CHAR = '\u0000'; // null char
const CHUNK_DELIMITER = '\u0001'; // start of heading
const VALUE_DELIMITER = '\u0002'; // start of text
const VALUE_ABSENT = '\u0003'; // end of text
const VALUE_NULL = '\u0014'; // device control four
const VALUE_NUMERICAL = '\u0004'; // end of transmission
const VALUE_SERIES_START = '\u0005'; // enquiry
const ATTRIB_SERIES_START = '\u0006'; // acknowledge
const PARENT_SERIES_START = '\u0011'; // device control one
const NEXTNODE_SERIES_START = '\u0012'; // device control two

const delimiterArray = [
    VALUE_DELIMITER, CHUNK_DELIMITER, VALUE_SERIES_START, ATTRIB_SERIES_START,
    PARENT_SERIES_START, NEXTNODE_SERIES_START, VALUE_ABSENT, VALUE_NUMERICAL,
    VALUE_NULL
];

const collectionDelimiters = [
    VALUE_SERIES_START, ATTRIB_SERIES_START, PARENT_SERIES_START,
    NEXTNODE_SERIES_START
];

function unescapeDelimiters(data: any) {
    data = String(data);
    delimiterArray.forEach(delimiter => {
        data = data.replace(new RegExp(ESCAPE_CHAR + delimiter, 'g'), delimiter);
    });
    data = data.replace(new RegExp(ESCAPE_CHAR + ESCAPE_CHAR, 'g'), ESCAPE_CHAR);
    return data;
}

/**
* Checks if a value is null or undefined
*
* @param {*} val The value
* @returns {Boolean}
*/
function isNullOrUndefined(val: any) {
    return val === null || val === undefined;
}

/**
* Returns the index of a delimiter in a string, skipping the escaped ones.
*
* @param {String} data String where to look at
* @param {String} delimiter String to look for
* @returns {Number} The retrieved index, or -1
*/
function indexOfNotEscaped(data: any, delimiter: any) {
    let index, lastAttempt = 0;
    while (isNullOrUndefined(index)) {
        let attempt = data.indexOf(delimiter, lastAttempt > 0 ? lastAttempt + 1 : lastAttempt);
        // did we find an escaped sequence?
        if (attempt !== -1 && data.charAt(attempt - 1) === ESCAPE_CHAR) {
            lastAttempt = attempt;
        } else {
            index = attempt;
        }
    }
    return index;
}

/**
* sliceChunk - Slices a chunk of data from the input, using a delimiter.
*
* @param  {string} data      Data where to search from
* @param  {string} [delimiter=CHUNK_DELIMITER]  A delimiter
* @return {Object}           Chunk object with `chunk` and `rest` properties
*/
function sliceChunk(data, delimiter) {
    delimiter = isNullOrUndefined(delimiter) ? CHUNK_DELIMITER : delimiter;
    let chunk = '', rest = '', retrieved = false;
    while (!retrieved) {
        let nextStop = indexOfNotEscaped(data, delimiter);
        if (nextStop !== -1) {
            chunk += data.substring(0, nextStop);
            rest = data.substring(nextStop + 1);
            retrieved = true;
        } else { // just take everything
            chunk += data.substring(0);
            rest = '';
            retrieved = true;
        }
    }
    return { chunk, rest };
}

/**
* sliceValueInChunk - Extracts a value from a chunk object as returned by
* `sliceChunk`, modifying the input chunk.
*
* @param  {Object} object    Chunk object with `chunk` and `rest` properties
* @param  {string} delimiter A delimiter
* @return {string}           The value, if found or otherwise empty string
*/
function sliceValueInChunk(object, delimiter) {
    let holder = sliceChunk(object.chunk, delimiter);
    object.chunk = holder.rest;
    return holder.chunk;
}

/**
* Explodes a collection of times & values into an object.
*
* @param {string} str_chunk  Chunk of strings
* @param {string} numbers    Chunk of numbers
* @return {Object}           Chunk object with `times` and `values` properties
*/
function explodeCollection(str_chunk, numbers) {
    let progress, temp, result = { values: [], times: [] };
    while (str_chunk.length) {
        progress = Number(sliceValueInChunk(numbers, VALUE_DELIMITER));
        result.times.push(progress);
        temp = { chunk: str_chunk, rest: '' };
        let value = sliceValueInChunk(temp, VALUE_DELIMITER);
        if (value === VALUE_NUMERICAL) {
            progress = Number(sliceValueInChunk(numbers, VALUE_DELIMITER));
            result.values.push(progress);
        } else if (value === VALUE_ABSENT) {
            result.values.push('');
        } else if (value === VALUE_NULL) {
            result.values.push(null);
        } else if (value.length) {
            result.values.push(unescapeDelimiters(value));
        }
        str_chunk = temp.chunk;
    }
    return result;
}

/**
* Slices a collection up until finding a next one, or to the end.
* Assumes delimiters in `collectionDelimiters` are in order of appearance.
*
* @param {string} str_chunk         Chunk of strings
* @return {Object}           Chunk object with `chunk` and `rest` properties
*/
function sliceUntilNextCollection(str_chunk, restoreDelimiter) {
    let result;
    collectionDelimiters.some(delim => {
        if (indexOfNotEscaped(str_chunk, delim) === 0) {
            str_chunk = str_chunk.substring(1);
            // We'll temptatively mark as to return until the end
            result = { chunk: '', rest: str_chunk };
        }
        if (indexOfNotEscaped(str_chunk, delim) !== -1) {
            result = sliceChunk(str_chunk, delim);
            if (result.chunk) {
                result.rest = restoreDelimiter ? delim + result.rest : result.rest;
            }
            return result.chunk;
        }
    });
    if (result) {
        if (!result.chunk.length && result.rest.length) {
            // Was this the last portion? Return it
            result.chunk = result.rest;
            result.rest = '';
        }
        return result;
    } else {
        // Nothing was found, just return rest
        return { chunk: '', rest: str_chunk };
    }
}

/**
* decoder - Decodes input into a data structure
*
* @param  {string} encodedInput
* @return {Array} Array of objects found
*/
export function decoder(encodedInput: any) {
    let result = [];
    while (encodedInput.length) {
        let strings, numbers;
        let init: any = {}, values: any = {}, attributes: any = {}, parentNodes: any = {}, nextNodes: any = {}, block: any = {};
        // extract strings & numbers chunks
        strings = sliceChunk(encodedInput, CHUNK_DELIMITER);
        if (strings.rest.indexOf(CHUNK_DELIMITER) === -1) {
            numbers = { chunk: strings.rest, rest: '' };
        } else {
            numbers = sliceChunk(strings.rest, CHUNK_DELIMITER);
        }
        encodedInput = numbers.rest;
        // `init` data
        init = sliceUntilNextCollection(strings.chunk, true);
        if (init.chunk) {
            strings.chunk = init.rest; // subtract init from strings
        } else if (init.rest) {
            // No further collection found, everything is `init`
            init.chunk = init.rest;
            strings.chunk = init.rest = '';
        }

        block.id = sliceValueInChunk(init, VALUE_DELIMITER);
        let name = sliceValueInChunk(init, VALUE_DELIMITER);
        if (name) {
            block.name = unescapeDelimiters(name);
        }

        if (init.chunk && !collectionDelimiters.some(delim => delim === init.chunk.charAt(0))) {
            block.type = unescapeDelimiters(sliceValueInChunk(init, VALUE_DELIMITER));
        } else if (block.name) {
            // skip if there's no 'name'
            block.type = 'html';
        }

        // `values` collection
        if (strings.chunk.indexOf(VALUE_SERIES_START) !== -1) {
            values = sliceUntilNextCollection(strings.chunk, true);
            strings.chunk = values.rest;
            block.values = explodeCollection(values.chunk, numbers);
        }

        // `attributes` collection
        attributes = { chunk: '', rest: '' };
        while (indexOfNotEscaped(strings.chunk, ATTRIB_SERIES_START) !== -1) {
            let temp = sliceUntilNextCollection(strings.chunk, true);
            attributes.chunk += temp.chunk + ATTRIB_SERIES_START;
            strings.chunk = temp.rest;
        }
        if (attributes.chunk) {
            block.attributes = [];
            while (attributes.chunk.length) {
                let temp = sliceChunk(attributes.chunk, ATTRIB_SERIES_START);
                let attr: any = { name: unescapeDelimiters(sliceValueInChunk(temp, VALUE_DELIMITER)) };
                attr.entries = explodeCollection(temp.chunk + VALUE_DELIMITER, numbers);
                block.attributes.push(attr);
                attributes.chunk = temp.rest;
            }
        }

        // `parentNodes` collection
        if (strings.chunk.indexOf(PARENT_SERIES_START) !== -1) {
            parentNodes = sliceUntilNextCollection(strings.chunk, true);
            strings.chunk = parentNodes.rest;
            block.parentNodes = explodeCollection(parentNodes.chunk, numbers);
        }

        // `nextNodes` collection
        if (strings.chunk.indexOf(NEXTNODE_SERIES_START) !== -1) {
            nextNodes = sliceUntilNextCollection(strings.chunk, true);
            strings.chunk = nextNodes.rest;
            block.nextNodes = explodeCollection(nextNodes.chunk, numbers);
        }

        result.push(block);
        // Leave rest to next cycle
        encodedInput = numbers.rest;
    }
    return result;
}

// Comlink.expose(async encodedData => decoder(encodedData), self);
