import logger from 'standalone-logger';
const log = logger (module);

import fs = require ('fs');

const baseDir = __dirname + '/../data/';

fs.watch (baseDir + 'json', {
	recursive: true
}, (event, file) => {
	if (!file.endsWith ('.json')) return;
	log ('<' + event + '> ' + file);
	handleFile (file);
});

async function readFile (file: string) {
	return new Promise<string> ((resolve, reject) => {
		fs.readFile (file, 'utf8', (err, data) => {
			if (err) reject (err);
			else resolve (data);
		});
	});
}

async function writeFile (file: string, data: string) {
	return new Promise<void> ((resolve, reject) => {
		fs.writeFile (file, data, 'utf8', err => {
			if (err) reject (err);
			else resolve ();
		});
	});
}


function transformBuckets (data: Array<{ start: number, density: number }>): string {
	var csv = 'start,density';
	data.forEach (line => {
		csv += '\n' + line.start + ',' + line.density;
	});
	return csv;
}

function transformBucketsSideways (data: Array<{ start: string, density: string }>): string {
	const csv: string[] = ['', ''];
	data.forEach (item => {
		csv[0] += (csv[0].length > 0 ? ',' : '') + item.start;
		csv[1] += (csv[1].length > 0 ? ',' : '') + item.density;
	});
	return csv.join ('\n');
}

const TRIM_FRONT = false, TRIM_BACK = true;
function trimXpct (data: Array<{ start: string, density: string }>, pct: number) {
	var acum = 0;
	if (TRIM_FRONT) {
		while (true) {
			acum += parseFloat (data[0].density);
			if (acum >= pct) break;
			data.shift ();
		}
		acum = 0;
	}
	if (TRIM_BACK) {
		while (true) {
			acum += parseFloat (data[data.length - 1].density);
			if (acum >= pct) break;
			data.pop ();
		}
	}
}

async function handleFile (file: string) {
	try {
		const json = await readFile (baseDir + 'json/' + file);
		const parsed = JSON.parse (json);
		trimXpct (parsed, .01);
		await writeFile (baseDir + 'csv/' + file.split ('json').join ('csv'), transformBuckets (parsed));
	} catch (err) {
		log (err);
	}
}
