import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HtmlParser, XmlParser } from '@angular/compiler';
import ts from 'typescript';

const origin = 'https://afyorahms.vercel.app';
const output = 'dist/afyora-hms/browser';
const read = (path) => readFileSync(path, 'utf8');
const attribute = (node, name) => node.attrs?.find((attr) => attr.name === name)?.value;
const text = (node) => node.value ?? (node.children ?? []).map(text).join('');
const elements = (nodes) => nodes.flatMap((node) => [node, ...elements(node.children ?? [])]);
const parse = (parser, source, path) => {
  const parsed = parser.parse(source, path, { tokenizeBlocks: false, tokenizeLet: false });
  assert.equal(parsed.errors.length, 0, `${path}: ${parsed.errors.join('\n')}`);
  return elements(parsed.rootNodes);
};
const source = ts.createSourceFile('routes.ts', read('src/app/app.routes.ts'), ts.ScriptTarget.Latest, true);
const paths = new Set();
const visit = (node) => {
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'path' && ts.isStringLiteral(node.initializer)) {
    paths.add(node.initializer.text);
  }
  ts.forEachChild(node, visit);
};
visit(source);

const xml = read(join(output, 'sitemap.xml'));
assert.equal(xml, read('public/sitemap.xml'), 'Sitemap must be copied unchanged');
const sitemap = parse(new XmlParser(), xml, 'sitemap.xml');
assert(sitemap.some((node) => node.name === 'urlset' && attribute(node, 'xmlns') === 'http://www.sitemaps.org/schemas/sitemap/0.9'));
const urls = sitemap.filter((node) => node.name === 'loc').map(text);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert.deepEqual([...urls].sort(), ['/', '/terms', '/dpa', '/privacy'].map((path) => origin + path).sort());
const titles = new Set();
const descriptions = new Set();
for (const url of urls) {
  const path = new URL(url).pathname.slice(1);
  assert(paths.has(path), `Nonexistent route: ${url}`);
  const file = join(output, path, 'index.html');
  const nodes = parse(new HtmlParser(), read(file), file);
  const one = (predicate, label) => {
    const matches = nodes.filter(predicate);
    assert.equal(matches.length, 1, `${url}: expected one ${label}`);
    return matches[0];
  };
  const title = text(one((node) => node.name === 'title', 'title'));
  const description = attribute(one((node) => node.name === 'meta' && attribute(node, 'name') === 'description', 'description'), 'content');
  assert(title && description, `${url}: empty metadata`);
  assert(!titles.has(title) && !descriptions.has(description), `${url}: non-unique metadata`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(attribute(one((node) => node.name === 'link' && attribute(node, 'rel') === 'canonical', 'canonical'), 'href'), url);
  assert.equal(attribute(one((node) => node.name === 'meta' && attribute(node, 'name') === 'robots', 'robots'), 'content'), 'index, follow');
  for (const property of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'og:image']) {
    const meta = one((node) => node.name === 'meta' && attribute(node, 'property') === property, property);
    assert(attribute(meta, 'content'));
    if (property === 'og:url') assert.equal(attribute(meta, 'content'), url);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    one((node) => node.name === 'meta' && attribute(node, 'name') === name, name);
  }
  const app = one((node) => node.name === 'app-root', 'rendered application');
  assert(text(app).trim().length > 200, `${url}: empty application shell`);
  const schemas = nodes.filter((node) => node.name === 'script' && attribute(node, 'type') === 'application/ld+json');
  assert.equal(schemas.length, path ? 0 : 1, `${url}: unexpected schema count`);
  if (!path) {
    assert.equal(text(one((node) => node.name === 'h1', 'homepage H1')), 'Afyora HMS');
    const schema = JSON.parse(text(schemas[0]));
    assert.equal(schema['@type'], 'SoftwareApplication');
    assert.equal(schema['@id'], `${origin}/#software`);
    assert.equal(schema.url, url);
    assert.equal(schema.name, 'Afyora HMS');
    assert.equal(schema.operatingSystem, 'Web browser');
    for (const claim of ['offers', 'aggregateRating', 'review', 'award']) assert.equal(schema[claim], undefined);
  }
  console.log(`Verified prerendered HTML and metadata: ${url}`);
}
const robots = read(join(output, 'robots.txt'));
assert.equal(robots, read('public/robots.txt'));
for (const bot of ['OAI-SearchBot', 'PerplexityBot', 'Googlebot', 'Bingbot', 'GPTBot']) assert(robots.includes(`User-agent: ${bot}`));
assert(robots.includes('Disallow: /'));
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert(existsSync(join(output, 'index.csr.html')), 'Missing private-route client shell');
assert(existsSync(join(output, 'shared/images/logo-circle.png')), 'Missing social image');
assert(!existsSync(join(output, 'assets/guides')), 'Unreviewed screenshots must not be public');
for (const path of ['patients', 'dashboard', 'login', 'ehr', 'billing']) {
  assert(!existsSync(join(output, path, 'index.html')), `Private route prerendered: ${path}`);
}
console.log('SEO output checks passed: sitemap, public routes, metadata, JSON-LD, assets and private-route exclusions.');