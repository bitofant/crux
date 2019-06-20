import logger from 'standalone-logger';
const log = logger (module);
import getHistogram from './query/histogram';
import { writeFile } from 'fs';

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
		let css = 'Time,' + competitors.map (comp => comp.name).join (',');
		multiTrim (.01, ...results);
		const highestBucket: number = Math.max (...results.map (result => result[result.length - 1].start));
		for (let i = 0; i <= highestBucket; i += 100) {
			let densities: number[] = results.map (result => {
				const item = result.find (fnd => fnd.start === i);
				return item ? item.density : 0;
			});
			css += `\n${i},${densities.join (',')}`;
		}
		writeFile (__dirname + '/../data/' + file, css, 'utf8', err => {
			if (err) throw err;
			log (`written ux report for ${competitors.length} competitors to "${file}"`);
		});
	})
	.catch (err => {
		log (err);
	});
}


getCompetitors ('competitors.css', [
	{
		name: 'Amazon',
		url: 'https://www.amazon.de'
	},
	{
		name: 'Conrad',
		url: 'https://www.conrad.de'
	}
]);
