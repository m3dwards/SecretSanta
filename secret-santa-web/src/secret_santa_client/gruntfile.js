module.exports = function (grunt) {
	grunt.initConfig({
		concat: {
			options: {
				separator: ';',
			},
			dist: {
				src: ['js/app.js', 'js/models.js', 'js/appController.js', 'js/preferencesController.js'],
				dest: '../../resources/public/js/app.js',
			},
		},
		uglify: {
			app: {
				files: {
					'../../resources/public/js//app.min.js': ['js/app.js', 'js/models.js', 'js/appController.js', 'js/preferencesController.js']
				}
			}
		},
		copy: {
			site: {
				files: [
					{ expand: true, src: ['**'], cwd: 'html/', dest: '../../resources/public/' },
					{ expand: true, src: ['angular.*'], cwd: 'bower_components/angular/', dest: '../../resources/public/js' },
					{ expand: true, src: ['angular-resource.*'], cwd: 'bower_components/angular-resource/', dest: '../../resources/public/js' },
					{ expand: true, src: ['angular-route.*'], cwd: 'bower_components/angular-route/', dest: '../../resources/public/js' },
					{ expand: true, src: 'bootstrap.min.js', cwd: 'bower_components/bootstrap/dist/js/', dest: '../../resources/public/js' },
					{ expand: true, src: 'moment.min.js', cwd: 'bower_components/moment/min/', dest: '../../resources/public/js' },
				],
			},
		},
		less: {
			bootstrap: {
				files: {
					"../../resources/public/css/bootstrap.css": "bower_components/bootstrap/less/bootstrap.less"
				}
			},
			site: {
				files: {
					"../../resources/public/css/site.css": "less/site.less"
				}
			},
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ['concat', 'uglify', 'copy', 'less']);
}