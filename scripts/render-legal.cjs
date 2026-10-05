const fs = require('node:fs');
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const [input, output] of [['PRIVACY_POLICY.md', 'privacy.html'], ['TERMS.md', 'terms.html'], ['ACCOUNT_DELETION.md', 'account-deletion.html']]) {
  const text = fs.readFileSync('docs/' + input, 'utf8');
  const body = text.split(/\r?\n/).map((line) => {
    const heading = line.match(/^(#{1,3}) (.+)$/);
    if (heading) return `<h${heading[1].length}>${escape(heading[2])}</h${heading[1].length}>`;
    return line ? `<p>${escape(line)}</p>` : '';
  }).join('\n');
  fs.writeFileSync('docs/' + output, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Subly ${escape(input)}</title><style>body{max-width:800px;margin:32px auto;padding:0 20px;font:16px/1.6 system-ui;color:#111}a{color:#075985}</style><body><nav><a href="index.html">Subly</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="account-deletion.html">Account deletion</a></nav>${body}</body></html>\n`);
}
