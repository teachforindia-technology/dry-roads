const moment = require('moment-timezone')

module.exports = {
	constructObject,
	calculateDeadline,
}

/**
 * takes an object and returns a new object with only the specified keys copied
 *
 * @param      {Object}  object  The source object
 * @param      {Array}  keys    The keys that should be copied over
 * @return     {Object}  The constructed object
 */
function constructObject(object, keys) {
	if (!object) return {}
	return Object.assign(
		{},
		...keys.map(key =>
			object[key] !== undefined ? {[key]: object[key]} : {}
		)
	)
}

function calculateDeadline(
	roundDeadlines = [
		'Sep 18 2022',
		'Nov 20 2022',
		'Jan 29 2023',
		'Mar 19 2023',
	],
	outcomeDates = ['Sep 28 2022', 'Nov 30 2022', 'Feb 08 2023', 'Mar 29 2023']
) {
	let visualDeadline,
		technicalDeadline,
		outcome,
		currentDate = moment().tz('Asia/Kolkata')

	let round = 1
	const ordinals = ['', 'First', 'Second', 'Third', 'Final']

	for (let deadline of roundDeadlines) {
		visualDeadline = moment.tz(deadline, 'MMM DD YYYY', 'Asia/Kolkata')
		technicalDeadline = moment(visualDeadline)
			.add(24, 'hours')
			.add(15, 'minutes') //12:15 am IST
		if (currentDate.isBefore(technicalDeadline)) break
		round++
	}
	for (let date of outcomeDates) {
		outcome = moment.tz(date, 'MMM DD YYYY', 'Asia/Kolkata')
		if (currentDate.isBefore(outcome)) break
	}

	visualDeadline.add(23, 'hours').add(59, 'minutes')

	return {
		round,
		ordinal: ordinals[round],
		visualDeadline,
		technicalDeadline,
		outcome,
	}
}
