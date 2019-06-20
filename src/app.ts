import logger from 'standalone-logger';
const log = logger (module);

import CruxQuery from './query/bigquery';

new CruxQuery ()
	.select('bin.start',
					'SUM(bin.density) AS density')
	.from ('UNNEST(first_contentful_paint.histogram.bin) AS bin')
	.where ('origin = "https://www.amazon.de"')
	.groupBy ('bin.start')
	.orderBy ('bin.start')
	.execute ()
	.then (result => {
		// log ('done; result => ' + JSON.stringify (rows, null, 4));
		const rows: Array<{ start: number, density: number }> = result[0];
		rows
			.filter (row => row.density > .001)
			.forEach (row => {
				const start = row.start;
				const end = row.start + 100;
				const density = Math.round (row.density * 10000) / 100;
				log (`${start}ms to ${end}ms: ${density}%`);
			});
	})
	.catch (err => {
		log (err);
	});
