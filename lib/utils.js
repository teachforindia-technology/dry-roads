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
		'Sep 06 2020',
		'Nov 08 2020',
		'Jan 17 2021',
		'Mar 14 2021',
	],
	outcomeDates = ['Sep 16 2020', 'Nov 20 2020', 'Jan 28 2021', 'Mar 24 2021']
) {
	let visualDeadline,
		technicalDeadline,
		outcome,
		currentDate = moment().tz('Asia/Kolkata')

	let round = 1
	const ordinals = ['', 'First', 'Second', 'Third', 'Final']

	for (let deadline of roundDeadlines) {
		visualDeadline = moment.tz(deadline, 'MMM DD YYYY', 'Asia/Kolkata')
		technicalDeadline = moment(visualDeadline).add(25, 'hours')
		if (currentDate.isBefore(technicalDeadline)) break
		round++
	}
	for (let date of outcomeDates) {
		outcome = moment.tz(date, 'MMM DD YYYY', 'Asia/Kolkata')
		if (currentDate.isBefore(outcome)) break
	}

	visualDeadline.add(22, 'hours')

	return {
		round,
		ordinal: ordinals[round],
		visualDeadline,
		technicalDeadline,
		outcome,
	}
}
