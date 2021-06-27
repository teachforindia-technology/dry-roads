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
		'Sep 19 2021',
		'Oct 01 2021',
		'Feb 06 2022',
	],
	outcomeDates = ['Oct 01 2021', 'Dec 09 2021', 'Feb 17 2022']
) {
	let visualDeadline,
		technicalDeadline,
		outcome,
		currentDate = moment().tz('Asia/Kolkata')

	let round = 1
	const ordinals = ['', 'First', 'Second', 'Third', 'Final']

	for (let deadline of roundDeadlines) {
		visualDeadline = moment.tz(deadline, 'MMM DD YYYY', 'Asia/Kolkata')
		technicalDeadline = moment(visualDeadline).add(24, 'hours') //12:00 am IST
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
