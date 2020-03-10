import { Options, ELayout } from './applications/Base';
import { ControlFreak } from './applications/ControlFreak/index';
import { Factory } from './applications/factory/index';
// import { xbox } from './applications/xbox/index';
import { EPersistence } from './interfaces/Application';
import * as path from 'path';
import * as yargs_parser from 'yargs-parser';
const homedir = require('os-homedir');
let argv = yargs_parser(process.argv.slice(2));
// let app = argv.app ? yargs_parser.app : "ControlFreak";
let root = argv.root ? path.resolve(argv.root) : path.resolve('../../../');
if (argv.nodejs && !argv.root) {
	root = path.resolve(path.join(__dirname, '..'));
	process.chdir(root);
}
if (argv.file) {

	/*
	if (commander.file) {
		var file = path.resolve(commander.file);
		if (fs.existsSync(file)) {
			var context = new vm.createContext({
				require: require.nodeRequire,
				commander: commander,
				console: console,
				process: process,
				setTimeout: setTimeout,
				global: global
			});
			var content = FileUtils.readFile(file);
			var script = new vm.Script(content);
			script.runInContext(context);
			return;
		} else {
			console.error('file specified but doesnt exists ' + commander.file);
		}
	}
	*/
}
let user: string = null;
if (!argv.user && argv.home === 'true') {
	user = path.join(homedir(), 'Documents', 'Control-Freak');
}
const CFOptions: Options = {
	root: root,
	port: argv.port,
	release: argv.release === 'true',
	clientRoot: argv.clientRoot,
	type: argv.type || ELayout.SOURCE,
	print: argv.print === 'true',
	uuid: argv.uuid || 'ide',
	user: user || (argv.user ? path.resolve(argv.user) : null),
	persistence: argv.persistences ? argv.persistence : EPersistence.MEMORY,
	interface: argv.interface ? argv.interface : null,
	home: argv.home === 'true'
};
export function create(app: string) {
	let application;
	switch (app) {
		case "ControlFreak": {
			application = new ControlFreak(CFOptions);
			application.run(true).then((deviceServerContext) => { });
			break;
		}
		case "factory": {
			application = new Factory(CFOptions);
			application.run(true).then((deviceServerContext) => { });
			break;
		}
		case "xbox": {
			// application = new xbox(CFOptions);
			// application.run(true).then(() => { });
			break;
		}
		default: {
			console.error('cant find application ' + app);
		}
	}

	return application;
}
create(argv.app || 'ControlFreak');
