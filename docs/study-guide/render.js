// node render.js in.html out.pdf   (needs playwright)
const { chromium } = require('playwright');
(async () => {
  const [, , input, output] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + input, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({
    path: output, format: 'A4', printBackground: true, displayHeaderFooter: false,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:7.5px;width:100%;text-align:center;font-family:monospace;color:#000">Kawsar Shuvo  |  TallyLearn NGO Study Guide  |  <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '17mm', bottom: '19mm', left: '15mm', right: '15mm' }, preferCSSPageSize: true,
  });
  await b.close();
})();
