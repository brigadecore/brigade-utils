const { events, Job, Group } = require("@brigadecore/brigadier");
const { Check } = require("./out/github");
const { NPMReleaseJob } = require("./out/npm");

const projectName = "brigade-utils";
const jsImg = "node:12.3.1-stretch"
const releaseTagRegex = /^refs\/tags\/v([0-9]+(?:\.[0-9]+)*(?:\-.+)?)$/;

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

function buildAndPublishImages(project) {
  let dockerRegistry = project.secrets.dockerhubRegistry || "docker.io";
  let dockerOrg = project.secrets.dockerhubOrg || "brigadecore";
  var job = new Job("build-and-publish-images", "docker:stable-dind");
  job.privileged = true;
  job.tasks = [
    "apk add --update --no-cache make git",
    "dockerd-entrypoint.sh &",
    "sleep 20",
    "cd /src/images",
    `docker login ${dockerRegistry} -u ${project.secrets.dockerhubUsername} -p ${project.secrets.dockerhubPassword}`,
    `DOCKER_REGISTRY=${dockerRegistry} DOCKER_ORG=${dockerOrg} make build-image push-image`,
    `docker logout ${dockerRegistry}`
  ];
  return job;
}

function runSuite(e, p) {
  var check = new Check(e, p, build());
  check.run();
}

function publish(project, version) {
  var publish = new NPMReleaseJob(`${projectName}-publish`);
  publish.env = {
    "NPM_TOKEN": project.secrets.npmToken,
    "VERSION": version
  };
  return publish;
}

events.on("push", (e, p) => {
  let matchStr = e.revision.ref.match(releaseTagRegex);
  if (matchStr) {
    // This is an official release with a semantically versioned tag
    let matchTokens = Array.from(matchStr);
    let version = matchTokens[1];
    return Group.runEach([
      build(),
      buildAndPublishImages(p),
      publish(p, version)
    ]);
  } else if (e.revision.ref.startsWith('refs/tags')) {
    console.log(`Ref ${e.revision.ref} does not match expected official release tag regex (${releaseTagRegex}); not releasing.`);
  } else { // push to master
    return Group.runAll([
      build(),
      buildAndPublishImages(p)
    ]);
  }
});

events.on("check_suite:requested", runSuite);
events.on("check_suite:rerequested", runSuite);

events.on("issue_comment:created", (e, p) => Check.handleIssueComment(e, p, runSuite));
events.on("issue_comment:edited", (e, p) => Check.handleIssueComment(e, p, runSuite));

