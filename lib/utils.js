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
		'Sep 01 2024',
		'Oct 20 2024',
		'Dec 08 2024',
		'Feb 02 2025',
		'Mar 09 2025',
		'Apr 06 2025',
	],
	outcomeDates = [
		'Sep 10 2024',
		'Oct 30 2024',
		'Dec 18 2024',
		'Feb 12 2025',
		'Mar 19 2025',
		'Apr 16 2025',
	]
) {
	let visualDeadline,
		technicalDeadline,
		outcome,
		currentDate = moment().tz('Asia/Kolkata')

	let round = 1
	const ordinals = [
		'',
		'First',
		'Second',
		'Third',
		'Fourth',
		'Fifth',
		'Final',
	]

	for (let deadline of roundDeadlines) {
		visualDeadline = moment.tz(deadline, 'MMM DD YYYY', 'Asia/Kolkata')
		technicalDeadline = moment(visualDeadline)
			.add(24, 'hours')
			.add(15, 'minutes') //12:15 am IST
			//extend Round 5 deadlines till 9 am instead of current 12:15 am IST
			//.add(8, 'hours')
			//.add(45, 'minutes')
		if (currentDate.isBefore(technicalDeadline)) break
		round++
	}
	/*
	for (let date of outcomeDates) {
		outcome = moment.tz(date, 'MMM DD YYYY', 'Asia/Kolkata')
		if (currentDate.isBefore(outcome)) break
	}*/

	visualDeadline.add(23, 'hours').add(59, 'minutes')

	return {
		round,
		ordinal: ordinals[round],
		visualDeadline,
		technicalDeadline,
		outcome,
		//currentDate
	}
}
/*
let conf = calculateDeadline()
console.log("round : ", conf.round)
console.log("currentDate : ", conf.currentDate.format('hh:mm:ss A zz [on] Do MMMM YYYY'))
console.log("visualDeadline : ", conf.visualDeadline.format('hh:mm A zz [on] Do MMMM YYYY'))
console.log("technicalDeadline : ", conf.technicalDeadline.format('hh:mm A zz [on] Do MMMM YYYY'))
*/
