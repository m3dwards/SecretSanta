module.exports = function(grunt) {
	grunt.initConfig({
		copy: {
			site: {
				files: [
					{ expand: true, src: ['**'], cwd: 'html/', dest: '../../wwwroot/' },
					{ expand: true, src: ['**'], cwd: 'js/', dest: '../../wwwroot/js' },
					{ expand: true, src: ['angular.*'], cwd: 'bower_components/angular/', dest: '../../wwwroot/js' },
					{ expand: true, src: ['angular-resource.*'], cwd: 'bower_components/angular-resource/', dest: '../../wwwroot/js' },
					{ expand: true, src: ['angular-route.*'], cwd: 'bower_components/angular-route/', dest: '../../wwwroot/js' },
					{ expand: true, src: 'bootstrap.min.js', cwd: 'bower_components/bootstrap/dist/js/', dest: '../../wwwroot/js' },
					{ expand: true, src: 'moment.min.js', cwd: 'bower_components/moment/min/', dest: '../../wwwroot/js' },
				],
			},
		},
		less: {
			bootstrap: {
				files: {
					"../../wwwroot/css/bootstrap.css": "bower_components/bootstrap/less/bootstrap.less"
				}
			},
			site: {
				files: {
					"../../wwwroot/css/site.css": "less/site.less"
				}
			},
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	
	grunt.registerTask('default', ['copy', 'less']);
}