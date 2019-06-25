import logger from 'standalone-logger';
import { execQuery } from './bigquery';
import PointInTime from './point-in-time';
import getAverage from './average';
const log = logger (module);



async function getTrend (website: string, months: number, event:
		'first_paint'|'first_contentful_paint'|'dom_content_loaded'|'onload') {
	const pointsInTime: Array<PointInTime> = [];
	for (let i = 0; i < months; i++) {
		pointsInTime.push (PointInTime.today ().add (i - months));
	}
	return await Promise.all (pointsInTime.map (time => getAverage (website, time, event)));
}


export default getTrend;
