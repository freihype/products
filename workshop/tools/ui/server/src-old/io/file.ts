const fs = require('fs');
import { IObjectLiteral } from '../interfaces/index';
const writeAtomic = require('write-file-atomic');
const writeFileOptions: IObjectLiteral = { mode: parseInt('0600', 8) };
export function read(file: string): string {
	const size = fs.statSync(file).size,
		buf = new Buffer(size),
		fd = fs.openSync(file, 'r');
	if (!size) {
		return '';
	}
	fs.readSync(fd, buf, 0, size, 0);
	fs.closeSync(fd);
	return buf.toString();
}
export function write(file: string, content, options?: IObjectLiteral): boolean {
	return writeAtomic.sync(file, content, options || writeFileOptions);
}
