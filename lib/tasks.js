const gulp = require('gulp'),
	jsonfile = require('jsonfile'),
	template = require('gulp-template'),
	inlinesource = require('gulp-inline-source'),
	htmlmin = require('gulp-htmlmin'),
	rename = require('gulp-rename'),
	webpack = require('webpack'),
	log = require('fancy-log'),
	async = require('async'),
	glob = require('glob'),
	fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	dot = require('dot-object'),
	babel = require('gulp-babel'),
	uglify = require('gulp-uglify'),
	download = require('gulp-download')

const accountsEndpoints = require('./crossroads-accounts-endpoints')

module.exports = {
	buildPublicVariables,
	buildHTMLFile,
	start,
	serverBuild,
	buildDist,
	lint,
	setupStyleGuides,
}

/**
 * Builds public variables from the (server) variables.
 *
 * @param      {Object}    params                      The parameters
 * @param      {Object}    params.map                  The map defining what value from variables to copy to publicVariables
 * @param      {Object}    params.config               The configuration (server variables)
 * @param      {string}    params.publicVariablesFile  The public variables file location
 * @param      {Function}  callback                  The callback
 */
function buildPublicVariables({map, config, publicVariablesFile}, callback) {
	function mapper(src, map) {
		if (!src || !map) return {}
		const dest = {}
		_.forEach(map, (srcKey, destKey) => {
			dot.copy(srcKey, destKey, src, dest)
		})
		return dest
	}
	const publicVariables = mapper(config, map)
	jsonfile.writeFile(publicVariablesFile, publicVariables, err => {
		err && log(err)
		callback(err)
	})
}

function buildHTMLFile(
	{
		bundleSrc,
		scopes,
		crossroadsConfig,
		indexSource,
		indexDestination,
		windowTitle,
		manifest = '/manifest.json',
		imageFolder = '/images',
		themeColor = '#000',
		styleSource = path.resolve(__dirname, '../templates/style.css'),
		customStyleSource = path.resolve(__dirname, '../templates/custom.css'),
		serviceWorkerInstallSource = path.resolve(
			__dirname,
			'../templates/serviceWorkerInstallation.js'
		),
	},
	callback
) {
	const crossroadsAccountsObject = accountsEndpoints({
		crossroadsConfig,
		applicationHost: crossroadsConfig.applicationHost,
		scopes,
	})

	gulp
		.src(
			indexSource ||
				path.resolve(__dirname, '../templates/index-src.html')
		)
		.pipe(
			template({
				crossroadsAccountsObject: JSON.stringify(
					crossroadsAccountsObject
				),
				bundleSrc: JSON.stringify(bundleSrc),
				windowTitle,
				manifest,
				imageFolder,
				themeColor,
				styleSource,
				customStyleSource,
				serviceWorkerInstallSource,
			})
		)
		.pipe(
			inlinesource({
				compress: false,
				rootpath: '/',
			})
		)
		.pipe(
			htmlmin({
				collapseWhitespace: true,
				minifyCSS: true,
				minifyJS: true,
			})
		)
		.pipe(rename('index.html'))
		.pipe(gulp.dest(indexDestination))
		.on('end', callback)
}

function start({title}) {
	process.title = title

	const spawn = require('cross-spawn'),
		nodemon = require('gulp-nodemon')

	let bunyan

	nodemon().on('readable', function() {
		bunyan && bunyan.kill()

		bunyan = spawn('./node_modules/bunyan/bin/bunyan', [
			'--output',
			'short',
			'--color',
		])

		bunyan.stdout.pipe(process.stdout)
		bunyan.stderr.pipe(process.stderr)

		this.stdout.pipe(bunyan.stdin)
		this.stderr.pipe(bunyan.stdin)
	})
}

function serverBuild(
	{
		webpackConfig,
		htmlConfig,
		serviceWorkerSource,
		serviceWorkerDestination,
		directoryToClean,
		publicPath,
	},
	callback
) {
	webpack(webpackConfig, (err, stats) => {
		if (err) return callback(err)

		log(stats.toString({colors: true}))
		const {hash} = stats
		async.parallel(
			{
				buildHTMLFile: cb => {
					htmlConfig.bundleSrc = `${publicPath}/bundle-${hash}.js`
					buildHTMLFile(htmlConfig, cb)
				},
				writeServiceWorker: cb => {
					writeServiceWorker(
						{
							hash,
							serviceWorkerSource,
							serviceWorkerDestination,
						},
						cb
					)
				},
			},
			(err, results) => {
				if (err) return callback(err)
				log(results.writeServiceWorker.toString({colors: true}))
				removeUnused(
					{
						dir: directoryToClean,
						includePattern: 'bundle-*.js',
						ignorePattern: `bundle-${hash}.js`,
					},
					() => {
						log('Removed Old files')
						return callback(err)
					}
				)
			}
		)
	})
}

function writeServiceWorker(
	{
		hash,
		serviceWorkerSource,
		serviceWorkerDestination,
		serviceWorkerFileName,
	},
	callback
) {
	const config = {
		entry: serviceWorkerSource,
		output: {
			path: serviceWorkerDestination,
			filename: serviceWorkerFileName || 'serviceWorker.js',
		},
		module: {
			loaders: [
				{
					test: /\.js?/,
					loaders: ['babel-loader'],
				},
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				hash: JSON.stringify(hash),
			}),
			new webpack.optimize.UglifyJsPlugin(),
		],
	}
	webpack(config, callback)
}

function removeUnused({dir, includePattern, ignorePattern}, cb) {
	const include = path.join(dir, includePattern)
	const ignore = path.join(dir, ignorePattern)
	glob(include, {ignore: [ignore]}, (err, files) => {
		files.map(fs.unlinkSync)
		cb()
	})
}

function buildDist({source, destination}) {
	gulp
		.src(source)
		.pipe(
			babel({
				presets: ['env'],
			})
		)
		.pipe(uglify())
		.pipe(gulp.dest(destination))
}

function lint({source}) {
	const eslint = require('gulp-eslint')
	return gulp
		.src(source)
		.pipe(eslint())
		.pipe(eslint.format())
}

/**
 * downloads eslint and prettier config files and calls setupPackageJson
 *
 * @param      {string}  arg1.destination  The destination folder - usually the root folder
 */
function setupStyleGuides({destination}) {
	const urls = [
		'https://raw.githubusercontent.com/teachforindia-technology/dry-roads/master/prettier.config.js',
		'https://raw.githubusercontent.com/teachforindia-technology/dry-roads/master/.eslintrc.json',
		'https://raw.githubusercontent.com/teachforindia-technology/dry-roads/master/.prettierignore',
	]
	async.each(
		urls,
		(url, cb) => {
			download(url)
				.pipe(gulp.dest(destination))
				.on('end', cb)
		},
		err => {
			if (err) log(err)
			setupPackageJson({pkgjsonLocation: destination})
		}
	)
}

/**
 * Adds eslint and prettier packages as devDependencies, precommit script to run prettier.
 *
 * @param      {string}  arg1.pkgjsonLocation  The location of the package.json file
 */
function setupPackageJson({pkgjsonLocation}) {
	const pkgjsonFile = path.resolve(pkgjsonLocation + '/package.json')
	const pkgjson = jsonfile.readFileSync(pkgjsonFile)
	if (!pkgjson.scripts) pkgjson.scripts = {}
	if (!pkgjson.devDependencies) pkgjson.devDependencies = {}
	const devDependencies = {
		prettier: '1.13.7',
		'pretty-quick': '^1.6.0',
		husky: '^0.14.3',
		'babel-eslint': '^8.2.5',
		eslint: '^5.0.1',
		'eslint-plugin-react': '^7.10.0',
	}
	const scripts = {
		precommit: 'pretty-quick --staged',
	}
	_.merge(pkgjson.devDependencies, devDependencies)
	_.merge(pkgjson.scripts, scripts)
	jsonfile.writeFile(pkgjsonFile, pkgjson, {spaces: 4}, err => {
		if (err) log(err)
		else log('Run npm install to complete setup')
	})
}
