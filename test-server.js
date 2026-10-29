/* Smallest check that fails if the server breaks: node test-server.js */
const assert = require("node:assert");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const dir = fs.mkdtempSync("/tmp/setu-");
fs.copyFileSync(__dirname + "/server.js", dir + "/server.js");
fs.mkdirSync(dir + "/js");
fs.copyFileSync(__dirname + "/js/ivr-core.js", dir + "/js/ivr-core.js");
fs.writeFileSync(dir + "/index.html", "<h1>setu</h1>");
fs.writeFileSync("/tmp/secret.txt", "nope");

const srv = require("node:child_process").spawn("node", [dir + "/server.js"], {
  env: { ...process.env, PORT: 3999, IVR_SECRET: "s3cret" },
});

const url = "http://localhost:3999";
const get = (p, o) => fetch(url + p, o);

setTimeout(async () => {
  try {
    assert.equal((await get("/api/state")).status, 204, "empty state -> 204");

    const state = { reports: [{ id: "R-101" }] };
    assert.equal(
      (await get("/api/state", { method: "PUT", body: JSON.stringify(state) })).status,
      204,
      "PUT accepted"
    );
    assert.deepEqual(await (await get("/api/state")).json(), state, "state round-trips");

    assert.equal(
      (await get("/api/state", { method: "PUT", body: "{not json" })).status,
      400,
      "garbage body rejected"
    );
    assert.deepEqual(await (await get("/api/state")).json(), state, "bad PUT didn't clobber");

    assert.match(await (await get("/")).text(), /setu/, "serves index.html");
    // fetch() normalizes %2e away, so send this one raw to really hit the guard
    const traversal = await new Promise((ok) =>
      require("node:http")
        .request({ port: 3999, path: "/%2e%2e/%2e%2e/tmp/secret.txt" }, (r) => ok(r.statusCode))
        .end()
    );
    assert.equal(traversal, 403, "no path traversal");
    assert.equal((await get("/data.json")).status, 403, "state file not served raw");

    // ---- phone webhooks ----
    const post = (p, body, secret = "s3cret") =>
      get(p, { method: "POST", headers: { "content-type": "application/json", "x-ivr-secret": secret }, body: JSON.stringify(body) });
    const seed = { settings: {}, reports: [{ id: "R-101", title: "Overhead tank overflowing", desc: "Water tank overflowing at night", area: "Ward 6", domain: "Water", status: "progress", supports: 14 }] };
    await get("/api/state", { method: "PUT", body: JSON.stringify(seed) });

    assert.equal((await post("/api/ivr/vote", { to: "1800-22-0101", from: "9876543210" }, "wrong")).status, 401, "bad secret refused");
    assert.equal((await get("/api/ivr/vote")).status, 405, "GET refused");
    const v1 = await (await post("/api/ivr/vote", { to: "1800-22-0101", from: "9876543210" })).json();
    assert.equal(v1.status, "counted"); assert.equal(v1.votes, 15);
    const v2 = await (await post("/api/ivr/vote", { code: "0101", from: "+91 98765 43210" })).json();
    assert.equal(v2.status, "duplicate", "same phone cannot vote twice");
    const c1 = await (await post("/api/ivr/complaint", { from: "9111111111", transcript: "garbage burning near the school every evening, smoke everywhere" })).json();
    assert.equal(c1.status, "created");

    // a stale browser snapshot must not wipe the phone votes / new problem
    await get("/api/state", { method: "PUT", body: JSON.stringify(seed) });
    const after = await (await get("/api/state")).json();
    assert.equal(after.reports.find((r) => r.id === "R-101").supports, 15, "phone vote survives stale PUT");
    assert.ok(after.reports.some((r) => r.source === "helpline"), "helpline problem survives stale PUT");

    console.log("ok");
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exitCode = 1;
  } finally {
    srv.kill();
  }
}, 400);
