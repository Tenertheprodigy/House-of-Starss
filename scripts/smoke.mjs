import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); });
function send(method, params = {}) { return new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); }); }
async function evaluate(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
const pause = ms => new Promise(r => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.navigate', { url: 'http://localhost:3000' });
for(let i=0;i<60;i++){ await pause(500); if(await evaluate('document.readyState === "complete" && !!document.querySelector(".final-cta")')) break; }
await pause(1500);
await mkdir('artifacts', { recursive: true });
for (const width of [390, 768, 1440]) {
 await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 540 });
 await pause(500);
 const dimensions = await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');
 assert.ok(dimensions.scroll <= dimensions.width, `Overflow at ${width}: ${JSON.stringify(dimensions)}`);
 await evaluate('window.scrollTo(0,0)'); await pause(250);
 const screenshot = await send('Page.captureScreenshot', { format: 'png' });
 await writeFile(`artifacts/desktop-${width}.png`, Buffer.from(screenshot.data, 'base64'));
 console.log(`Layout ${width}px: passed`);
}
for (const section of ['payouts','faq']) {
 await evaluate('document.getElementById(' + JSON.stringify(section) + ').scrollIntoView()'); await pause(300);
 const shot = await send('Page.captureScreenshot', {format: 'png'}); await writeFile('artifacts/' + section + '.png', Buffer.from(shot.data, 'base64'));
}
assert.equal(await evaluate('document.title'), 'House of Stars — The Exchange for Illiquid Assets');
assert.ok(await evaluate('[...document.querySelectorAll("a.button")].every(a=>a.href==="https://t.me/houseofstarsorderbot")'));
await evaluate('document.querySelectorAll(".payout-select")[1].click()'); await pause(200);
assert.equal(await evaluate('document.querySelectorAll(".payout-select")[1].getAttribute("aria-pressed")'), 'true');
await evaluate('document.querySelector("summary").click()');
assert.equal(await evaluate('document.querySelector("details").open'), true);
await evaluate('document.querySelectorAll(".chat-payouts button")[2].click()'); await pause(200);
assert.ok(await evaluate('document.querySelector(".chat-selection").textContent.includes("Fiat")'));
await evaluate('document.querySelector(".footer-links button").click()'); await pause(200);
assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'), 'Close dialog');
await evaluate('document.querySelector(".legal-dialog>button").click()');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evaluate('window.scrollTo(0,0);document.querySelector(".menu-toggle").click()'); await pause(200);
assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'true');
await evaluate('document.querySelector(".mobile-nav a").click()'); await pause(200);
assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'false');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".flow")).animationName'), 'none');
assert.deepEqual(errors, []);
console.log('Metadata, CTA links, payouts, FAQ, dialog focus, mobile navigation, reduced motion, and runtime errors: passed');
ws.close();

