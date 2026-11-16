import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const dir = 'client/public/images';
const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.png'));

for (const file of files) {
  const input = path.join(dir, file);
  const output = path.join(dir, file.replace(/\.png$/, '.webp'));
  const width = file.startsWith('hero') ? 1600 : 1100;
  await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
  await fs.unlink(input);
  const { size } = await fs.stat(output);
  console.log(`${file} -> ${path.basename(output)} (${Math.round(size / 1024)} KB)`);
}
