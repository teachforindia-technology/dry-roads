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
		'Sep 03 2023',
		'Oct 15 2023',
		'Dec 03 2023',
		'Feb 04 2024',
		'Mar 17 2024',
		'Jun 01 2024',
	],
	outcomeDates = [
		'Sep 13 2023',
		'Oct 25 2023',
		'Dec 13 2023',
		'Feb 14 2024',
		'Mar 27 2024',
		'Jun 10 2024',
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
