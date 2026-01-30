const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svgDir = path.join(__dirname, "..", "badges", "svg");
const out1x = path.join(__dirname, "..", "badges", "png", "1x");
const out2x = path.join(__dirname, "..", "badges", "png", "2x");
for (const dir of [out1x, out2x]) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const files = fs.readdirSync(svgDir).filter(f => f.endsWith(".svg"));
  for (const file of files) {
    const base = file.replace(/\.svg$/, "");
    const svgBuffer = fs.readFileSync(path.join(svgDir, file));

    await sharp(svgBuffer, { density: 144 })
      .resize({ height: 20 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(out1x, `${base}.png`));

    await sharp(svgBuffer, { density: 288 })
      .resize({ height: 40 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(out2x, `${base}.png`));

    console.log('exported', base);
  }
})();
