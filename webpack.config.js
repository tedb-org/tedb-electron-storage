const path = require('path');
const webpack = require('webpack');
const CleanPlugin = require('clean-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyserPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const environment = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase().trim() : 'development';
const production = environment === 'production';

const workingDir = __dirname.charAt(0).toUpperCase() + __dirname.slice(1);
console.log(`Building for ${environment}`);
console.log(workingDir);

let plugins = [
    new CleanPlugin('dist'),
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify('production'),
        },
    }),
    new webpack.LoaderOptionsPlugin({
        debug: true,
    }),
    new webpack.NamedModulesPlugin(),

    // new BundleAnalyserPlugin(),
];

if (production) {
    plugins = plugins.concat([
        new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 51200,
        }),
        new UglifyJSPlugin(),
        new MinifyPlugin(),
    ]);
}

module.exports = {
    target: "electron-renderer",
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    node: {
        __filename: false,
        __dirname: false,
        // fs: 'empty',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                }
            },
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader",
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: [
            '.ts', '.js',
        ],
        modules: [
            path.join(__dirname, 'src'),
            'node_modules',
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'commonjs2',
    },

    plugins,
};
