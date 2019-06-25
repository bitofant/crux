import logger from 'standalone-logger';
import { execQuery } from './bigquery';
import PointInTime from './point-in-time';
import getAverage from './average';
const log = logger (module);


interface DeviceTypes extends Array<'phone'|'tablet'|'desktop'> {}
interface ConnectionTypes extends Array<'3G'|'4G'> {}


async function getDevice (website: string, devices: DeviceTypes, connections: ConnectionTypes,
		event: 'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload') {
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
				AND (${ devices.map (d => `form_factor.name = '${d}'`).join (' OR ') })
				AND (${ connections.map (c => `effective_connection_type.name = '${c}'`).join (' OR ') })
		GROUP BY
				bin.start
		ORDER BY
				bin.start`) as Array<Array<{start:number,density:number}>>;
	if (rows.length === 0) return null;
	let avg = 0;
	let normalized = 0;
	rows.forEach (row => {
		avg += (row.start + 100) * row.density;
		normalized += row.density;
	});
	if (Math.round (normalized * 100) !== 100) {
		// ignoring rounding error that always occurs when summing up floats
		// throw Error ('The sum of all partial densities should equal 1; ' + JSON.stringify({website, avg, normalized}));
		avg = avg / normalized;
	}
	// log (`average ${website.substr(12)} for ${devices.join ('|')} and ${connections.join ('|')} is ${Math.round(avg)}`);
	return avg;
}


async function getDevices (website: string,
		event: 'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload') {
	const phones3g = await getDevice (website, ['phone'], ['3G'], event);
	const phones4g = await getDevice (website, ['phone'], ['4G'], event);
	const desktop3g = await getDevice (website, ['desktop'], ['3G'], event);
	const desktop4g = await getDevice (website, ['desktop'], ['4G'], event);
	const tablet3g = await getDevice (website, ['tablet'], ['3G'], event);
	const tablet4g = await getDevice (website, ['tablet'], ['4G'], event);
	return {
		phones3g, phones4g,
		desktop3g, desktop4g,
		tablet3g, tablet4g
	};
}


export default getDevices;
export {
	DeviceTypes,
	ConnectionTypes
};
