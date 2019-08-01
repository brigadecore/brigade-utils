const { events, Job } = require("@brigadecore/brigadier");
const { Check } = require("./out/github");

const projectName = "brigade-utils";
const jsImg = "node:12.3.1-stretch";

function build() {
  var build = new Job(`${projectName}-build`, jsImg);

  build.tasks = [
    "cd /src",
    "yarn install",
    "yarn compile",
    "yarn test",
    "yarn audit"
  ];

  return build;
}

function runSuite(e, p) {
  var check = new Check(e, p, build());
  check.run();
}

events.on("check_suite:requested", runSuite);
events.on("check_suite:rerequested", runSuite);

events.on("issue_comment:created", (e, p) => Check.handleIssueComment(e, p, runSuite));
events.on("issue_comment:edited", (e, p) => Check.handleIssueComment(e, p, runSuite));
