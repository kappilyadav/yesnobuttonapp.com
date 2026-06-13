import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Map the ChatGPT-generated PNGs (sorted by filename) to these blog slugs.
const slugs = [
  'yes-no-questions-list',
  'how-to-make-decisions',
  'yes-or-no-questions-for-friends',
  'funny-yes-or-no-questions',
  'yes-or-no-questions-for-couples'
];

const sizes = [1200, 800, 400];
const quality = 80;

const imagesDir = path.join(process.cwd(), 'public', 'images');
const backupDir = path.join(imagesDir, 'originals');

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const pngPattern = /^ChatGPT Image.*\.png$/i;

async function main() {
  const files = fs.readdirSync(imagesDir).filter(f => pngPattern.test(f)).sort();
  if (files.length === 0) {
    console.error('No ChatGPT PNG images found in', imagesDir);
    process.exit(1);
  }

  const count = Math.min(files.length, slugs.length);
  console.log(`Found ${files.length} PNG(s). Will process ${count}.`);

  for (let i = 0; i < count; i++) {
    const srcName = files[i];
    const slug = slugs[i];
    const baseName = `${slug}-hero`;
    const srcPath = path.join(imagesDir, srcName);

    // Backup original
    const backupPath = path.join(backupDir, srcName);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcPath, backupPath);
      console.log('Backed up', srcName, '->', path.relative(process.cwd(), backupPath));
    } else {
      console.log('Backup already exists for', srcName);
    }

    // Rename original to friendly PNG (if not already present)
    const newPngName = baseName + '.png';
    const newPngPath = path.join(imagesDir, newPngName);
    if (!fs.existsSync(newPngPath)) {
      try {
        fs.renameSync(srcPath, newPngPath);
        console.log('Renamed', srcName, '->', newPngName);
      } catch (err) {
        console.error('Failed to rename', srcName, err);
        continue;
      }
    } else {
      console.log(newPngName, 'already exists, skipping rename');
    }

    // Produce webp variants
    for (const w of sizes) {
      const outName = `${baseName}-${w}.webp`;
      const outPath = path.join(imagesDir, outName);
      try {
        await sharp(newPngPath)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality })
          .toFile(outPath);
        console.log('Wrote', outName);
      } catch (err) {
        console.error('Error writing', outName, err);
      }
    }
  }

  console.log('Image conversion complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
