var isparta = require('isparta');
var paths = require('./build/paths');
var compilerOptions = require('./build/babel-options');

module.exports = function(config) {
    config.set({
        frameworks: ['jspm', 'mocha', 'chai'],
        
        jspm: {
            config: 'config.js',
            loadFiles: [paths.tests],
            serveFiles: [paths.source]
        },  
        
        files: [],
        
        preprocessors: {
            [paths.tests]: ['babel'],
            [paths.source]: ['babel', 'sourcemap', 'coverage']
        },

        'babelPreprocessor': {
            options: compilerOptions.base()
        },
        
        reporters: ['coverage', 'progress'],
        
        coverageReporter: {
            instrumenters: {
                isparta: isparta
            },
            
            instrumenter: {
                [paths.source]: 'isparta'
            },
            
            dir: 'build/reports/coverage/',
            
            reporters: [{
                type: 'text-summary'
            }, {
                type: 'html',
                subdir: 'html'
            }, {
                type: 'lcovonly',
                subdir: 'lcov',
                file: 'report-lcovonly.txt'
            }]
        },
        
        port: 9876,
        
        colors: true,
        
        logLevel: config.LOG_INFO,
        
        autoWatch: true,
        
        browsers: ['Chrome'],
        
        singleRun: false
    });
};
