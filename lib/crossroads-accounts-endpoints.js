/**
 * gets endpoints to fetch crossroads accounts, urls for google login
 *
 * @param      {Object}  params  The parameters
 * @param      {string}  applicationHost  hostname of the application
 * @param      {Object}  crossroadsConfig  config of crossroads host
 * @param      {Array.<string>}  scopes  google oauth scopes
 * @return     {Object}  loginURI, loginURIForced, endpoints object
 */
module.exports = function getCrossroadsAccountsEndpoints(params) {
	const {applicationHost, crossroadsConfig, scopes} = params

	const protocol = crossroadsConfig.shouldAppBeSecure ? 'https://' : 'http://'
	const crossroadsPortFragment =
		crossroadsConfig.port === 80 || crossroadsConfig.port === 443
			? ''
			: ':' + crossroadsConfig.port
	const crossroadsHost = crossroadsConfig.host + crossroadsPortFragment
	const redirectURI =
		params.redirectURI ||
		protocol + crossroadsHost + '/sessions/v0/goauthcallback'
	const accountsEndpointRoot =
		protocol + crossroadsHost + '/sessions/v0/accounts'
	const accountsEndpoints = {
		get: accountsEndpointRoot,
		destroy: accountsEndpointRoot + '/destroy',
		refresh: accountsEndpointRoot + '/refresh',
	}
	const stateObject = {
		redirectURI,
		applicationHost,
	}
	const state = Buffer.from(JSON.stringify(stateObject)).toString('base64')
	const loginURI =
		'https://accounts.google.com/o/oauth2/auth?' +
		'access_type=offline' +
		'&include_granted_scopes=true' +
		'&scope=' +
		encodeURIComponent(scopes.join(' ')) +
		'&response_type=code' +
		'&client_id=' +
		crossroadsConfig.clientId +
		'&redirect_uri=' +
		encodeURI(redirectURI) +
		'&state=' +
		state
	const loginURIForced = `${loginURI}&approval_prompt=force`

	return {
		loginURI,
		loginURIForced,
		accountsEndpoints,
	}
}
