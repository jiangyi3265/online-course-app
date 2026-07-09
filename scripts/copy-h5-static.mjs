import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staticDir = join(root, 'static');
const h5Dirs = [
	join(root, 'dist', 'build', 'h5'),
	join(root, 'unpackage', 'dist', 'build', 'web')
].filter(existsSync);

if (!h5Dirs.length) {
	throw new Error('H5 output directory not found.');
}

if (existsSync(staticDir)) {
	for (const h5Dir of h5Dirs) {
		const target = join(h5Dir, 'static');
		rmSync(target, { recursive: true, force: true });
		mkdirSync(target, { recursive: true });
		cpSync(staticDir, target, { recursive: true });
		console.log(`[postbuild] copied static assets to ${target}`);
	}
}
