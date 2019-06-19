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
		...keys.map(
			key => (object[key] !== undefined ? {[key]: object[key]} : {})
		)
	)
}

function calculateDeadline(
	roundDeadlines = [
		'Aug 25 2019',
		'Oct 20 2019',
		'Dec 15 2019',
		'Mar 01 2020',
	]
) {
	let visualDeadline,
		technicalDeadline,
		currentDate = moment().tz('Asia/Kolkata')

	let round = 1
	const ordinals = ['', 'First', 'Second', 'Third', 'Final']

	for (let deadline of roundDeadlines) {
		visualDeadline = moment.tz(deadline, 'MMM DD YYYY', 'Asia/Kolkata')
		technicalDeadline = moment(visualDeadline).add(25, 'hours')
		if (currentDate.isBefore(technicalDeadline)) break
		round++
	}

	visualDeadline.add(22, 'hours')

	return {
		round,
		ordinal: ordinals[round],
		visualDeadline,
		technicalDeadline,
	}
}
