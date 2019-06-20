import logger from 'standalone-logger';
const log = logger (module);
import getHistogram from './query/histogram';



getHistogram ('https://www.amazon.de', 'first_contentful_paint')
	.then (rows => {
		rows.filter (row => row.density > .001)
			.forEach (row => {
				const start = row.start;
				const end = row.start + 100;
				const density = Math.round (row.density * 10000) / 100;
				log (`${start}ms to ${end}ms: ${density}%`);
			})
	})
	.catch (err => {
		log (err);
	});
