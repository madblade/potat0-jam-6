
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

const PATH = {
    // input: path.resolve(__dirname, 'src'),
    // eslint-disable-next-line no-undef
    output: path.resolve(__dirname, 'dist')
};

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
            path: PATH.output,
            publicPath: './',
            filename: '[name].[hash].js'
        },

        module: {
            rules: [
                {
                    test: /\.worker\.js$/,
                    use: { loader: 'worker-loader' },
                },
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
                    test: /\.wasm$/,
                    use: ['file-loader?name=[name].[ext]?skip_parse=true'],
                    type: 'javascript/auto'
                },
                {
                    test: /\.(png|svg|jpg|gif|fbx|glb)$/,
                    use: ['file-loader'],
                },
            ],
        },

        devServer: {
            // host: '0.0.0.0', // <- local network debugging
            // writeToDisk: true, // <- debug dist folder
            contentBase: PATH.output,
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
        },

        // experiments: {
        //     syncWebAssembly: true,
        //     asyncWebAssembly: true
        // },

        resolve: { // <- this for Ammo.js
            fallback: {
                path: false,
                fs: false
            },
        }
    };
};
