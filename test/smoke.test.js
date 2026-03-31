const test = require("node:test");
const assert = require("node:assert/strict");
const { initDb } = require("../src/db");
const { app } = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  initDb();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("homepage loads", async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /GameGrid/);
});

test("catalog loads", async () => {
  const response = await fetch(`${baseUrl}/catalog`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Catalog de produse/);
});

test("ritual module loads", async () => {
  const response = await fetch(`${baseUrl}/ritual-personalizat`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Loadout Personalizat/);
});

test("login page loads", async () => {
  const response = await fetch(`${baseUrl}/login`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Intra in cont/);
});
