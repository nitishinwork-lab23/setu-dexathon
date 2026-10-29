/* Checks for the phone core: node test-ivr.js */
const assert = require("node:assert");
const IVR = require("./js/ivr-core.js");

const base = () => IVR.ensureFields({
  settings: {},
  reports: [
    { id: "R-101", title: "Overhead tank overflowing every night", area: "Ward 6, Ranchi",
      desc: "Water overflows from the community tank between 11pm-1am, flooding the lane.", domain: "Water", status: "progress", supports: 14, clusterOf: 2 },
    { id: "R-102", title: "Streetlight not working near school", area: "Ward 3, Ranchi",
      desc: "Streetlight pole 14 outside the primary school has been dark for 2 weeks.", domain: "Infrastructure", status: "pending", supports: 5, clusterOf: 1 },
  ],
});

// unique number per problem
let d = base();
assert.equal(d.reports[0].voteNumber, "1800-22-0101");
assert.equal(d.reports[1].voteNumber, "1800-22-0102");

// one vote per phone per problem, but the same phone can vote for another problem
assert.equal(IVR.castVote(d, "1800-22-0101", "9876543210").status, "counted");
assert.equal(d.reports[0].supports, 15);
assert.equal(IVR.castVote(d, "1800 22 0101", "+91 98765 43210").status, "duplicate", "same phone, formatted differently");
assert.equal(d.reports[0].supports, 15, "duplicate not counted");
assert.equal(IVR.castVote(d, "0102", "9876543210").status, "counted", "other problem by keypad code");
assert.equal(IVR.castVote(d, "1800-22-9999", "9876543210").status, "unknown_problem");
assert.equal(IVR.castVote(d, "0101", "12345").status, "bad_number");
assert.ok(!JSON.stringify(d).includes("9876543210"), "full number never stored");

// complaint that matches -> joins cluster, counts as vote
let r = IVR.fileComplaint(d, "9123456780", "the water tank near our ward is overflowing at night and flooding the lane");
assert.equal(r.action, "joined");
assert.equal(r.report.id, "R-101");
assert.equal(r.report.clusterOf, 3);
assert.equal(r.report.supports, 16);
// same caller complains again -> no double count
r = IVR.fileComplaint(d, "9123456780", "tank overflowing again, water flooding the lane at night");
assert.equal(r.action, "joined"); assert.equal(r.duplicate, true);
assert.equal(d.reports[0].supports, 16);

// unrelated complaint -> new problem for operator review
r = IVR.fileComplaint(d, "9000000001", "garbage is burning near the school playground every evening, smoke everywhere");
assert.equal(r.action, "created");
assert.equal(r.report.domain, "Environment");
assert.equal(r.report.needsOperatorReview, true);
assert.equal(r.report.voteNumber, "1800-22-0103");
assert.equal(IVR.fileComplaint(d, "9000000001", "hi").action, "empty");

// domain guard: a road complaint must not join a water problem
r = IVR.fileComplaint(d, "9000000002", "big pothole on the main road near the bridge, bikes are falling");
assert.equal(r.action, "created"); assert.equal(r.report.domain, "Infrastructure");

// merge: stale browser snapshot must not erase phone votes / helpline problems
const server = JSON.parse(JSON.stringify(d));
const stale = base();
const merged = IVR.mergePhoneData(server, stale);
assert.equal(merged.reports.find((x) => x.id === "R-101").phoneVotes.length, 2);
assert.equal(merged.reports.find((x) => x.id === "R-101").supports, 16);
assert.ok(merged.reports.some((x) => x.source === "helpline"), "helpline problem kept");
assert.ok(merged.callLog.length >= 6);
// merging twice is stable
const again = IVR.mergePhoneData(JSON.parse(JSON.stringify(merged)), JSON.parse(JSON.stringify(merged)));
assert.equal(again.reports.find((x) => x.id === "R-101").supports, 16);

console.log("ivr-core: all checks passed");
