module.exports = {
	constructObject,
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
			key =>
				object[key] !== undefined
					? {
							[key]: object[key],
					  }
					: {}
		)
	)
}
