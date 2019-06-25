function twoDigits (n: number) {
	const sn = String (n);
	return sn.length < 2 ? '0' + sn : sn;
}

const months = [
	'January', 'February', 'March', 'April', 'May', 'June', 'July',
	'August', 'September', 'October', 'November', 'December'
];


export default class PointInTime {

	public static today (): PointInTime {
		const currentDate = new Date ();
		const currentYear = currentDate.getFullYear ();
		const currentMonth = currentDate.getMonth () + 1;
		return new PointInTime (currentYear, currentMonth);
	}

	public static lastMonth (): PointInTime {
		return PointInTime.today ().add (-1);
	}

	public static isPIT (obj: any): obj is PointInTime {
		return typeof (obj) === 'object' &&
				typeof (obj.month) === 'number' &&
				typeof (obj.year) === 'number' &&
				typeof (obj.toString) === 'function';
	}

	constructor (public year: number, public month: number) {
	}

	public add (months: number) {
		this.month += months;
		while (this.month > 12) {
			this.year += 1;
			this.month -= 12;
		}
		while (this.month < 1) {
			this.year -= 1;
			this.month += 12;
		}
		return this;
	}

	public toString () {
		return String (this.year) + twoDigits (this.month);
	}

	public readable (long?: boolean) {
		if (long) {
			return `${months[this.month - 1]} ${this.year}`;
		}
		return `${months[this.month - 1].substr (0, 3)} ${String(this.year).substr (2, 2)}`;
	}

}
