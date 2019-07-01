import logger from 'standalone-logger';
import { execQuery } from './bigquery';
const log = logger (module);


/**
 * 
 * @param website url of website to get information on
 * @param event the chrome user experience report event
 * @param trim optional; removes buckets from the back until at most `trim` percent of visitors are removed
 */
async function getHistogram (website: string, event:
		'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload', trim?: number) {
	const [rows] = await execQuery (`
		#standardSQL
		SELECT
				bin.start,
				SUM(bin.density) AS density
		FROM
				\`chrome-ux-report.all.201905\`,
				UNNEST(${event}.histogram.bin) AS bin
		WHERE
				origin = '${website}'
				AND form_factor.name = 'phone'
				AND effective_connection_type.name = '3G'
		GROUP BY
				bin.start
		ORDER BY
				bin.start`) as Array<Array<{start:number,density:number}>>;
	let normalizing = 0;
	rows.forEach (row => normalizing += row.density);
	if (Math.round (normalizing * 100) !== 100) {
		rows.forEach (row => {
			row.density /= normalizing;
		});
		log ('normalized...');
	}
	if (trim && trim > 0) {
		let accumulated = 0;
		while (rows.length > 0) {
			accumulated += rows[rows.length - 1].density;
			if (accumulated > trim) break;
			rows.pop ();
		}
	}
	return rows as Array<{ start: number, density: number }>;
}

export default getHistogram;
