module.exports = function(grunt) {
	grunt.initConfig({
		copy: {
			site: {
				files: [
					{ expand: true, src: ['**'], cwd: 'html/', dest: '../../resources/public/' },
					{ expand: true, src: ['**'], cwd: 'js/', dest: '../../resources/public/js' },
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
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	
	grunt.registerTask('default', ['copy', 'less']);
}