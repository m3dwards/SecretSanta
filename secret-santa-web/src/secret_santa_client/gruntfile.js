module.exports = function(grunt) {
	grunt.initConfig({
		copy: {
			site: {
				files: [
					{ expand: true, src: ['html/*'], dest: '../../wwwroot/' },
				],
			},
		},
	});
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	
	grunt.registerTask('default', ['copy']);
}