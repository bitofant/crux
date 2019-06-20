import logger from 'standalone-logger';
const log = logger (module);
import BigQuery = require ('@google-cloud/bigquery');
import { readFileSync } from 'fs';

const projectId = JSON.parse (readFileSync ('credentials.json', 'utf8')).project_id;

const client = new BigQuery.BigQuery ({
	keyFilename: 'credentials.json',
	projectId
});

async function execQuery (query: string) {
	const result = await client.query (query);
	return result;
}

class CruxQuery {
	private _select: string = '';
	private _from: string = '`chrome-ux-report.all.201905`';
	private _where: string = '';
	private _groupBy: string = null;
	private _orderBy: string = null;
	private _limit: number = null;

	public select (...args: string[]) {
		this._select += (this._select.length > 0 ? ',' : '') + args.join (',');
		return this;
	}

	public from (...args: string[]) {
		this._from += ',' + args.join (',');
		return this;
	}

	public where (...args: string[]) {
		this._where += (this._where.length > 0 ? ',' : '') + args.join (',');
		return this;
	}

	public groupBy (...args: string[]) {
		this._groupBy = (this._groupBy || '') + ((this._groupBy || '').length > 0 ? ',' : '') + args.join (',');
		return this;
	}

	public orderBy (...args: string[]) {
		this._orderBy = (this._orderBy || '') + ((this._orderBy || '').length > 0 ? ',' : '') + args.join (',');
		return this;
	}

	public limit (limit: number) {
		this._limit = limit;
		return this;
	}

	public execute () {
		let query = `
			SELECT ${this._select}
			FROM ${this._from}
			WHERE ${this._where}`;
		if (this._groupBy !== null) query += '\nGROUP BY ' + this._groupBy;
		if (this._orderBy !== null) query += '\nORDER BY ' + this._orderBy;
		if (this._limit !== null) query += '\nLIMIT ' + this._limit;
		query = query.split ('\n').map (line => line.trim ()).join ('\n  ');
		log ('executing... ' + query);
		return execQuery (query);
	}

}

export default CruxQuery;

// async function getRows () {
// 	console.log ('start');
// 	const [rows] = await client.query ({
// 		query: `
// 			#standardSQL
// 			SELECT
// 					bin.start,
// 					SUM(bin.density) AS density
// 			FROM
// 					\`chrome-ux-report.all.201905\`,
// 					UNNEST(first_contentful_paint.histogram.bin) AS bin
// 			WHERE
// 					--origin = 'https://www.mediamarkt.de'
// 					--OR
// 					origin = 'https://www.iteratec.de'
// 			GROUP BY
// 					bin.start
// 			ORDER BY
// 					bin.start
// 			LIMIT 70`
// 	});
// 	console.log ('done');
// 	rows.forEach (row => {
// 		console.log (row);
// 	});
// }

// getRows ();