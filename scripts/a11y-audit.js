// Accessibility audit script (node)
// Usage: node scripts/a11y-audit.js
const fs = require('fs');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });

dom.window.addEventListener('load', () => {
  axe.run(dom.window.document, {}, (err, results) => {
    if (err) throw err;
    if (results.violations.length === 0) {
      console.log('No accessibility violations found!');
    } else {
      console.log('Accessibility Violations:');
      results.violations.forEach(v => {
        console.log(`- [${v.id}] ${v.help}`);
        v.nodes.forEach(n => console.log(`  Selector: ${n.target.join(', ')}`));
      });
    }
    process.exit(0);
  });
}); 