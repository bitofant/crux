import logger from 'standalone-logger';
import { existsSync, readFileSync, fstat, writeFile } from 'fs';
const log = logger (module);
const CACHE_FILE = __dirname + '/../cache.json';

const cache: {[key:string]: string} = existsSync (CACHE_FILE) ? JSON.parse (readFileSync (CACHE_FILE, 'utf8')) : {};

const WRITE_DEBOUNCE_DELAY = 500;
var writeTimer: NodeJS.Timeout = null;


function minimizeKey (key: string): string {
	return key.split ('\n')
			.map (line => line.trim ())
			.filter (line => !line.startsWith ('#'))
			.join (' ')
		.split ('\t').join (' ')
		.split ('  ').join (' ')
		.split ('  ').join (' ')
		.split (', ').join (',')
		.trim ();
}


function getCached (key: string): any {
	return JSON.parse (cache[minimizeKey (key)] || 'null');
}

function setCache (key: string, obj: any) {
	cache[minimizeKey (key)] = JSON.stringify (obj);
	if (writeTimer !== null) {
		clearTimeout (writeTimer);
	}
	writeTimer = setTimeout (() => {
		writeFile (CACHE_FILE, JSON.stringify (cache, null, '\t'), 'utf8', err => {
			log ('cache file ' + (err ? 'not' : 'successfully') + ' updated');
			if (err) log (err);
		});
	}, WRITE_DEBOUNCE_DELAY);
}

export { getCached, setCache };
