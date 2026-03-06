/**
 * Report HTML generation
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate an HTML comparison report from capture results.
 * @param {Array} results - Screenshot capture results
 * @param {Object} config - Capture configuration
 * @param {string} templateDir - Directory containing report-template.html
 */
export async function generateReport(results, config, templateDir) {
  const outputDir = path.resolve(config.output);

  const metadata = {
    url: config.url,
    capturedAt: new Date().toISOString(),
    results: results.map(r => ({
      ...r,
      filepath: undefined,
    })),
  };

  await fs.writeFile(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  const templatePath = path.join(templateDir, 'report-template.html');
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch {
    template = generateDefaultTemplate();
  }

  const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const html = template
    .replace('__METADATA__', JSON.stringify(metadata))
    .replace('__URL__', escapeHtml(config.url))
    .replace('__DATE__', escapeHtml(new Date().toLocaleString()));

  await fs.writeFile(path.join(outputDir, 'index.html'), html);

  console.log(`\n\u2705 Report generated: ${path.join(outputDir, 'index.html')}`);
  console.log(`\uD83D\uDCF8 ${results.length} screenshots captured`);

  return path.join(outputDir, 'index.html');
}

function generateDefaultTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Browser Comparison Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
  .card { background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
  .card-header { padding: 1rem; border-bottom: 1px solid #333; }
  .card-header h3 { font-size: 0.9rem; }
  .card-header p { font-size: 0.75rem; color: #888; margin-top: 0.25rem; }
  .card img { width: 100%; display: block; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
  .tag-chromium { background: #1a3a1a; color: #4caf50; }
  .tag-webkit { background: #1a1a3a; color: #5c8aff; }
  .tag-firefox { background: #3a2a1a; color: #ff9800; }
  .tag-inapp { background: #3a1a2a; color: #e91e63; }
  .tag-ios { background: #1a1a2a; color: #79c0ff; }
  .tag-android { background: #1a2a1a; color: #7ee787; }
  .tag-desktop { background: #2a1a3a; color: #ab82ff; }
</style>
</head>
<body>
<h1>Browser Comparison \u2014 __URL__</h1>
<p style="color:#888;margin-bottom:2rem;">Captured: __DATE__</p>
<div class="grid" id="grid"></div>
<script>
const meta = __METADATA__;
const grid = document.getElementById('grid');
const fragment = document.createDocumentFragment();
meta.results.forEach(r => {
  const tagClass = r.type === 'in-app' ? 'tag-inapp' : 'tag-' + r.browserEngine;
  const platformTag = r.platform || 'android';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';

  const h3 = document.createElement('h3');
  h3.appendChild(document.createTextNode(r.browser + ' '));
  const engineSpan = document.createElement('span');
  engineSpan.className = 'tag ' + tagClass;
  engineSpan.textContent = r.browserEngine;
  h3.appendChild(engineSpan);
  h3.appendChild(document.createTextNode(' '));
  const platformSpan = document.createElement('span');
  platformSpan.className = 'tag tag-' + platformTag;
  platformSpan.textContent = platformTag;
  h3.appendChild(platformSpan);

  const p = document.createElement('p');
  p.textContent = r.device + ' \\u2014 ' + r.viewport.width + '\\xD7' + r.viewport.height;

  header.appendChild(h3);
  header.appendChild(p);

  const img = document.createElement('img');
  img.src = 'screenshots/' + r.filename;
  img.alt = r.browser + ' ' + r.device;
  img.loading = 'lazy';

  card.appendChild(header);
  card.appendChild(img);
  fragment.appendChild(card);
});
grid.appendChild(fragment);
</script>
</body>
</html>`;
}
