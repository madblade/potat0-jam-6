
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = function(env) {
    return {
        entry: './src/main.js',
        target: 'web',

        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                favicon: './src/assets/favicon.ico',
                baseUrl: env.development ?
                    '/' : 'https://madblade.github.io/potat0-jam-6/'
            }),
            new webpack.HotModuleReplacementPlugin()
        ],

        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: './',
            filename: '[name].[hash].js'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    // Load GLSL as strings
                    test: /\.glsl$/,
                    loader: 'raw-loader'
                },
                {
                    // Load HTML templates as strings
                    test: /\.html$/,
                    exclude: /index.html/,
                    loader: 'raw-loader'
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.(png|svg|jpg|gif|fbx|glb)$/,
                    use: ['file-loader'],
                },
            ]
        },

        devServer: {
            // host: '0.0.0.0',
            contentBase: path.resolve(__dirname, 'dist'),
            // contentBase: 'http://localhost:8080/dist',
            port: 8080,
            hot: true,
            disableHostCheck: true,
            open: true,
            openPage: './dist/'
        },

        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        }
    };
};
