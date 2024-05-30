import { vitePlugin as remix } from '@remix-run/dev'
import { installGlobals } from '@remix-run/node'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import tsconfigPaths from 'vite-tsconfig-paths'

installGlobals()

export default defineConfig({
	base: '/admin/',
	plugins: [
		remix({
			basename: '/admin/',
		}),
		tsconfigPaths(),
		babel({
			filter: /\.[jt]sx?$/,
			babelConfig: {
				presets: ['@babel/preset-typescript'],
				plugins: [
					['babel-plugin-react-compiler', {}],
				],
			},
		}),
	],
})
