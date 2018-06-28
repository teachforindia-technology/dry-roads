const gulp = require('gulp')

const tasks = require('./lib/tasks')

gulp.task('lint', () => {
	const source = ['**/*.js', '!node_modules/**']
	tasks.lint({source})
})

gulp.task('publish', ['lint'])
