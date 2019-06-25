import logger from 'standalone-logger';
const log = logger (module);
import getHistogram from './query/histogram';
import { writeFile } from 'fs';
import { competitors } from './competitors';
import getAverage from './query/average';
import getTrend from './query/trend';
import PointInTime from './query/point-in-time';
import getDevices, { DeviceTypes, ConnectionTypes } from './query/devices';

interface Website {
	name: string;
	url: string;
};

function multiTrim (trim: number, ...results: Array<Array<{start: number, density: number}>>) {
	const trimTo: number[] = [];
	results.forEach (result => {
		let accumulated = 0;
		for (let i = result.length - 1; i >= 0; i--) {
			accumulated += result[i].density;
			if (accumulated >= trim) {
				trimTo.push (result[i].start);
				break;
			}
		}
	});
	const maxTrimTo = Math.max (...trimTo);
	results.forEach (result => {
		const findTrimTo = result.findIndex (test => test.start > maxTrimTo);
		if (findTrimTo > 0) {
			result.splice (findTrimTo, result.length - findTrimTo);
		}
	});
}


async function getCompetitors (file:string, competitors: Website[]) {
	Promise.all (competitors.map (competitor => {
		return getHistogram (competitor.url, 'first_contentful_paint');
	}))
	.then (results => {
		let csv = 'Time,' + competitors.map (comp => comp.name).join (',');
		multiTrim (.01, ...results);
		const highestBucket: number = Math.max (...results.map (result => result[result.length - 1].start));
		for (let i = 0; i <= highestBucket; i += 100) {
			let densities: number[] = results.map (result => {
				const item = result.find (fnd => fnd.start === i);
				return item ? item.density : 0;
			});
			csv += `\n${i},${densities.join (',')}`;
		}
		writeFile (__dirname + '/../data/' + file, csv, 'utf8', err => {
			if (err) throw err;
			log (`written ux report for ${competitors.length} competitors to "${file}"`);
		});
	})
	.catch (err => {
		log (err);
	});
}


async function getCompetitorAverage (file: string, competitors: Website[]) {
	Promise.all (competitors.map (competitor => {
		return getAverage (competitor.url, 1, 'first_contentful_paint');
	}))
	.then (results => {
		let csv = 'Name,Average';
		results.forEach ((val, i) => {
			csv += `\n${competitors[i].name},${val}`;
		});
		writeFile (__dirname + '/../data/' + file, csv, 'utf8', err => {
			if (err) throw err;
			log (`written ux report for ${competitors.length} competitors to "${file}"`);
		});
	})
	.catch (err => {
		log (err);
	});
}

async function getCompetitorTrends (file: string, months: number, competitors: Website[]) {
	const results = await Promise.all (competitors.map (competitor => getTrend (competitor.url, months, 'onload')));
	let csv = 'Name';
	for (let i = -months; i < 0; i++) {
		csv += ',' + PointInTime.today ().add (i).readable ();
	}
	results.map ((averages, i) => {
		return {
			name: competitors[i].name,
			averages
		};
	})
	.sort ((a, b) => {
		return (b.averages[months - 1] || 99999) - (a.averages[months - 1] || 99999);
	})
	.forEach (competitor => {
		csv += `\n${competitor.name},${competitor.averages.map (Math.round).join (',')}`;
	});
	// let turnedCSV: string[] = [];
	// let lines = csv.split ('\n').map (row => row.split (','));
	// for (let i = 0; i < lines.length; i++) {
	// 	for (let j = 0; j < lines[i].length; j++) {
	// 		if (j >= turnedCSV.length) turnedCSV.push ('');
	// 		turnedCSV[j] += (turnedCSV[j].length === 0 ? '' : ',') + lines[i][j];
	// 	}
	// }
	// csv = turnedCSV.join ('\n');
	writeFile (__dirname + '/../data/' + file, csv, 'utf8', err => {
		if (err) throw err;
		log (`written ux trends for ${competitors.length} competitors to "${file}"`);
	})
}


async function getCompetitorDevices (file: string, competitors: Website[]) {
	const results = await Promise.all (competitors.map (competitor => getDevices (competitor.url, 'first_contentful_paint')));
	let csv = 'Name,Phones (3g),Phones (4g),Desktop,Tablet';
	results.map ((result, i) => {
		return {
			name: competitors[i].name,
			phones3g: Math.round (result.phones3g),
			phones4g: Math.round (result.phones4g),
			desktop:  Math.round (result.desktop4g),
			tablet:   Math.round (result.tablet4g)
		};
	})
	.sort ((a, b) => {
		if (a.phones3g === 0) return -9999;
		if (b.phones3g === 0) return 9999;
		return b.phones3g - a.phones3g;
	})
	.forEach (result => {
		csv += `\n${result.name},${result.phones3g},${result.phones4g},${result.desktop},${result.tablet}`;
	});
	writeFile (__dirname + '/../data/' + file, csv, 'utf8', err => {
		if (err) throw err;
		log (`write ux device reports for ${competitors.length} competitors to "${file}"`);
	});
}


// getCompetitors ('competitors.csv', competitors);
// getCompetitorAverage ('competitors-avg.csv', competitors);
getCompetitorTrends ('competitor-trends.csv', 6, competitors);
// getCompetitorDevices ('competitor-devices.csv', competitors);
