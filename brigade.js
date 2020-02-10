const { events, Job, Group } = require("@brigadecore/brigadier");
const { Check } = require("./out/github");

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

function buildAndPublishKindImage(project) {
  let dockerRegistry = project.secrets.dockerhubRegistry || "docker.io";
  let dockerOrg = project.secrets.dockerhubOrg || "brigadecore";
  var job = new Job("build-and-publish-kind-image", "docker:stable-dind");
  job.privileged = true;
  job.tasks = [
    "apk add --update --no-cache make git",
    "dockerd-entrypoint.sh &",
    "sleep 20",
    "cd /src/kind-image",
    `docker login ${dockerRegistry} -u ${project.secrets.dockerhubUsername} -p ${project.secrets.dockerhubPassword}`,
    `DOCKER_REGISTRY=${dockerRegistry} DOCKER_ORG=${dockerOrg} make build push`,
    `docker logout ${dockerRegistry}`
  ];
  return job;
}

function runSuite(e, p) {
  var check = new Check(e, p, build());
  check.run();
}

function publish(project, version) {
  var publish = new Job(`${projectName}-publish`, jsImg);
  publish.env = {
      "NPM_TOKEN": project.secrets.npmToken
  };
  // The steps to publish include the steps to build, and then some, so we'll
  // use the build job steps as a starting point.
  publish.tasks = build().tasks;
  // If we leave .npmrc at the root of the project with the NPM_TOKEN env var
  // unset, all yarn commands will fail. Since this env var is populated with
  // the correct secret ONLY for this one job, we create .npmrc right here,
  // just in time.
  publish.tasks.push("echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc");
  publish.tasks.push("apt-get update");
  publish.tasks.push("apt-get install -y jq");
  publish.tasks.push("cat package.json | jq '.version |= \"" + version + "\"' > package.json.tmp");
  publish.tasks.push("rm package.json")
  publish.tasks.push("mv package.json.tmp package.json")
  publish.tasks.push("npm publish");
  return publish;
}

events.on("push", (e, p) => {
  let matchStr = e.revision.ref.match(releaseTagRegex);
  if (matchStr) {
    // This is an official release with a semantically versioned tag
    let matchTokens = Array.from(matchStr);
    let version = matchTokens[1];
    return Group.runEach([
      buildAndPublishKindImage(p),
      // publish runs the build tasks first, so no need to call build() here
      publish(p, version)
    ]);
  } else if (e.revision.ref.startsWith('refs/tags')) {
    console.log(`Ref ${e.revision.ref} does not match expected official release tag regex (${releaseTagRegex}); not releasing.`);
  } else { // push to master
    return Group.runAll([
      build(),
      buildAndPublishKindImage(p)
    ]);
  }
});

events.on("check_suite:requested", runSuite);
events.on("check_suite:rerequested", runSuite);

events.on("issue_comment:created", (e, p) => Check.handleIssueComment(e, p, runSuite));
events.on("issue_comment:edited", (e, p) => Check.handleIssueComment(e, p, runSuite));
