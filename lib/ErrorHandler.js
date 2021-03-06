const bunyan = require('bunyan')
const rp = require('request-promise')
const moment = require('moment-timezone')

// colors and icons to use to send message to slack
const levelConfig = {
	fatal: {
		color: 'danger',
		iconEmoji: ':skull:',
	},
	error: {
		color: 'danger',
		iconEmoji: ':x:',
	},
	warn: {
		color: 'warning',
		iconEmoji: ':warning:',
	},
	info: {
		color: 'good',
		iconEmoji: ':information_source:',
	},
	debug: {
		color: '#ffffff',
		iconEmoji: ':bug:',
	},
	trace: {
		color: '#ffffff',
		iconEmoji: ':book:',
	},
}

module.exports = function ErrorHandler({
	logsDirectory,
	name,
	errorCodes,
	sendToSlack,
	slackHookPath,
	includeStack,
	isTesting = false,
}) {
	const levels = Object.keys(levelConfig)
	// [ 'fatal', 'error', 'warn', 'info', 'debug', 'trace' ]

	if (isTesting) levels.splice(2) // only ['fatal', 'error']

	const streams = levels.map(level => {
		if (level === 'debug')
			return {
				level,
				stream: process.stdout,
			}
		return {
			level,
			path: `${logsDirectory}/${level}.log`,
		}
	})
	const log = bunyan.createLogger({
		name,
		streams,
	})

	this.sendError = function sendError(params) {
		const {code, _email, data, userMessage, err} = params

		const error = err instanceof Error ? err : new Error(err)
		error.code = code

		const errorToReturn = {code, userMessage}

		const errorRecord = errorCodes[code]
		let logLevel

		if (!code || !errorRecord) {
			logLevel = 'error'
			log.error('no error code for ' + code)
		} else {
			logLevel = errorRecord.logLevel
			if (!userMessage)
				errorToReturn.userMessage = errorRecord.userMessage
		}

		// eg: log.fatal(object)
		log[logLevel](error)

		// send to slack channel
		if (sendToSlack && (!code || !errorRecord || errorRecord.sendToSlack)) {
			const {color, iconEmoji} = levelConfig[logLevel]
			const attachment = {
				color,
				fields: [
					{
						title: 'level',
						value: logLevel,
						short: true,
					},
					{
						title: 'time',
						value: moment().format(),
						short: true,
					},
					{
						title: 'code',
						value: code,
						short: true,
					},
					{
						title: 'email',
						value: _email,
						short: true,
					},
					{
						title: 'data',
						value: JSON.stringify(data),
					},
				],
			}
			if (includeStack)
				attachment.fields.push({
					title: 'stack',
					value: error.stack,
				})
			else
				attachment.fields.push({
					title: 'message',
					value: error.message,
				})
			sendHookMessage({
				attachment,
				slackHookPath,
				username: name,
				iconEmoji,
			}).catch(log.error)
		}

		return errorToReturn
	}
}

async function sendHookMessage({
	slackHookPath,
	username,
	iconEmoji,
	attachment,
}) {
	const payload = {
			username,
			icon_emoji: iconEmoji,
			attachments: [attachment],
		},
		options = {
			uri: `https://hooks.slack.com/services/${slackHookPath}`,
			method: 'POST',
			body: payload,
			json: true,
		}

	return rp(options)
}
