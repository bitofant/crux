import logger from 'standalone-logger';
import { execQuery } from './bigquery';
const log = logger (module);


async function getHistogram (website: string, event:
		'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload') {
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
		GROUP BY
				bin.start
		ORDER BY
				bin.start`);
	return rows as Array<{ start: number, density: number }>;
}

export default getHistogram;
