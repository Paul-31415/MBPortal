
b: app/index.ts
	yarn esbuild app/index.ts --bundle --outfile=build/bundle.js --sourcemap
	cp app/index.html build/index.html
	cp -r app/resources build/resources
