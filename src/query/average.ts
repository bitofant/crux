import logger from 'standalone-logger';
import { execQuery } from './bigquery';
import PointInTime from './point-in-time';
const log = logger (module);


/**
 * 
 * @param website url of website to get information on
 * @param event the chrome user experience report event
 * @param trim optional; removes buckets from the back until at most `trim` percent of visitors are removed
 */
async function getAverage (website: string, monthsAgo: number|PointInTime, event:
		'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload') {
	const pointInTime = PointInTime.isPIT (monthsAgo) ? monthsAgo : PointInTime.lastMonth ().add (-monthsAgo);
	log (`fetching ${website.substr(12)} for ${pointInTime.readable(true)}`);
	const [rows] = await execQuery (`
		#standardSQL
		SELECT
				bin.start,
				SUM(bin.density) AS density
		FROM
				\`chrome-ux-report.all.${pointInTime}\`,
				UNNEST(${event}.histogram.bin) AS bin
		WHERE
				origin = '${website}'
				AND form_factor.name = 'phone'
		GROUP BY
				bin.start
		ORDER BY
				bin.start`) as Array<Array<{start:number,density:number}>>;
	if (rows.length === 0) return 0;
	let avg = 0;
	let normalized = 0;
	rows.forEach (row => {
		avg += (row.start + 100) * row.density;
		normalized += row.density;
	});
	if (Math.round (normalized * 100) !== 100) {
		// ignoring rounding error that always occurs when summing up floats
		// throw Error ('The sum of all partial densities should equal 1');
		avg /= normalized;
	}
	log (`average ${website.substr(12)} for ${pointInTime.readable(true)} is ${Math.round(avg)}`);
	return avg;
}

export default getAverage;
