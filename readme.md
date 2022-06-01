> ⚠️&nbsp;&nbsp;This repo contains the source for a component of the Brigade
> v1.x ecosystem. Brigade v1.x reached end-of-life on June 1, 2022 and as a
> result, this component is no longer maintained.

# Brigade Utils

This repository aims to package frequently used Brigade jobs, allowing us to avoid replicating the same functionality. It is imported as an NPM package in the Brigade worker, and can be used directly in `brigade.js` scripts.

To add this package, [use the `brigade.json` file][brigade-json] in the repository, and add the following package:

```json
{
  "dependencies": {
    "@brigadecore/brigade-utils": "0.5.0"
  }
}
```

> Note that any dependency added here should point the exact version (and not use the tilde `~` and caret `^` to indicate semver compatible versions).

> Use the appropriate version of this library that you can find on NPM - [`@brigadecore/brigade-utils`][npm]

# Quick Links

* [The GitHub Library](#the-github-library)
* [The Kind Library](#the-kind-library)
* [The NPM Library](#the-npm-library)
* [Contributing](#contributing)

___

## The GitHub library

### Check

Brigade comes with a [GitHub application][gh-app] that can be used to queue builds and show logs directly through the [GitHub Checks API][checks-api]. After following the instructions to set it up, adding a `brigade.js` script that uses this API can be done using the `Check` object from this library:

```javascript
const { events, Job } = require("@brigadecore/brigadier");
const { Check } = require("@brigadecore/brigade-utils");

const projectName = "brigade-utils";
const jsImg = "node:12.3.1-stretch";

function build(event, project) {
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
  var check = new Check(e, p, build(e, p));
  check.run();
}

events.on("check_suite:requested", runSuite);
events.on("check_suite:rerequested", runSuite);

// this enables "/brig run" comments from allowed authors to start a check run
events.on("issue_comment:created", (e, p) =>
  Check.handleIssueComment(e, p, runSuite)
);
```

This script is one that can be used to build this repository.

> Note: `Check.handleIssueComment` currently only handles `/brig run` comments - to add your own, see implementation for this method.

### Release

For streamlined creation of a GitHub release, one can utilize the `GitHubRelease` job.  It will create
a release associated with the provided tag, populating the release body with a listing of commits since
the previous tag.  Here is an example of how it can be used:

```js
const { events, Job, Group } = require("@brigadecore/brigadier");
const { GitHubRelease } = require("@brigadecore/brigade-utils");

const releaseTagRegex = /^refs\/tags\/(v[0-9]+(?:\.[0-9]+)*(?:\-.+)?)$/;

// Create a shared storage object that can be shared between
// the buildBrig job and the githubRelease job
let releaseStorage = {
  enabled: true,
  path: "/release-assets",
};

// Build any artifacts that should be uploaded with the release
function buildBrig(tag) {
  var job = new Job("build-brig", "quay.io/deis/lightweight-docker-go:v0.7.0");
  // Enable shared storage for this job
  job.storage = releaseStorage;

  let gopath = "/go";
  let localPath = gopath + `/src/github.com/brigadecore/brigade`;

  job.shell = "/bin/bash";
  job.mountPath = localPath;
  job.tasks = [
    `cd ${localPath}`,
    `SKIP_DOCKER=true VERSION=${tag} make build-brig`,
    // copy the release assets into the shared storage path
    `cp -r bin/* ${releaseStorage.path}`
  ];
  return job;
}

// Create a GitHubRelease job
function githubRelease(p, tag) {
  // Provide the GitHubRelease job with the project, the tag
  // and the shared storage path
  var job = new GitHubRelease(p, tag, releaseStorage.path);
  // Enable shared storage for this job
  job.storage = releaseStorage;
  return job;
}

// On a push event from GitHub, if the tag matches our regex,
// build the release arifacts first and then run the release
events.on("push", (e, p) => {
  let matchStr = e.revision.ref.match(releaseTagRegex);
  if (matchStr) {
    // This is an official release with a semantically versioned tag
    let matchTokens = Array.from(matchStr);
    let version = matchTokens[1];
    return Group.runEach([
      buildBrig(version),
      githubRelease(p, version)
    ]);
});
```

## The Kind library

[Kind][kind] (Kubernetes in Docker) is a tool for creating a local Kubernetes cluster using Docker containers as nodes, and it is a very fast and convenient way of setting up a Kubernetes cluster for testing.

But while [setting it up locally is straightforward][kind-getting-started], running a Kind cluster inside your Kubernetes cluster (for various end-to-end testing scenarios) is rather difficult. This library abstracts all that, and creating and using a cluster can be easily achieved with Brigade:

```js
const { events, Job } = require("@brigadecore/brigadier");
const { KindJob } = require("@brigadecore/brigade-utils");

function e2e(event, project) {
  let kind = new KindJob("kind");
  kind.tasks.push(
    // add your end-to-end tests
    "kubectl get pods --all-namespaces"
  );

  return kind.run();
}

events.on("exec", e2e);
```

The `KindJob` class already configures the environment for a 1-node Kind cluster through Brigade:

- marks the job as privileged
- mounts all necessary volumes for Kind to work properly (see [this Kind issue](https://github.com/kubernetes-sigs/kind/issues/303#issuecomment-518593664))
- starts Docker in Docker
- creates a 1-node Kind cluster
- exports the `KUBECONFIG` environment variable to point to the newly created cluster
- unsets the Kubernetes environment variables that point to the host cluster
- ensures the cluster deletion command is always executed as cleanup

Notes:

- in order to start properly, ensure the Brigade project allows privileged jobs and allows host mounts (see [this issue](https://github.com/kubernetes-sigs/kind/issues/303#issuecomment-518593664))
- this is an experimental configuration, which mounts host directories inside a privileged pod - before deploying this at scale on a production cluster, monitor your environment for any resource leaks. We do ensure to delete clusters created with the default configuration (using Linux traps), but overriding that can lead to damage to your cluster (see [this issue](https://github.com/kubernetes-sigs/kind/issues/759)).
- this job runs as a privileged pod in your cluster
- the default image used contains `docker`, `go`, `kind`, `git`, `wget`, `apk` - you can supply your own, or you can use `apk`, or download other tools you might need.
- if overriding the default configuration, ensure you are cleaning up clusters created to avoid resource leaks. See [how tasks are configured](./src/kind.ts).
- the default timeout for Brigade jobs is 15 minutes - by default, the `KindJob` sets the timeout to 30 minutes, and you can configure it by setting the `job.timeout` property - and keep in mind the value is in milliseconds.

## The NPM Library

### Release

The `NPMReleaseJob` is a class that can be used for publishing releases to [npm](https://www.npmjs.com/).  It is a simple extension of the stock `Job` class and the resulting pod uses and image based on an official [node Docker image](https://hub.docker.com/_/node).  This Dockerfile can be seen [here](./images/npm-release/Dockerfile).

The main tasks pre-baked into this job are to:

* Inspect the job environment for two crucial variables, namely:
  * `NPM_TOKEN`: the authorization token with ability to publish to the package to npm
  * `VERSION`: the version of the package intending to be published
  * (If either are missing, the job will exit non-zero with the appropriate error message)
* Inject `VERSION` into the `package.json` assumed to be in the working directory
* Invoke `npm publish`

Here's an example use of this job:

```javascript
function publish(project, version) {
  var publish = new NPMReleaseJob("npm-publish");
  publish.env = {
    "NPM_TOKEN": project.secrets.npmToken,
    "VERSION": version
  };
  return publish;
}
```

When `publish.run()` is invoked, this job will execute and the end result should be a freshly-published npm package!

# Contributing

This Brigade project accepts contributions via GitHub pull requests. Prerequisites to build and test this library:

- Node
- `yarn`

For this library, we accept jobs that are commonly used and whose implementation has the potential to be replicated across multiple projects - if you think your use case falls under this category, feel free to open an issue proposing it.

To install dependencies, compile, test the project, and ensure there are no vulnerabilities in the dependencies, run:

```
$ yarn install
$ yarn compile
$ yarn test
$ yarn audit
```

Note that this repository _does not_ ignore the generated `out/` directory that contains the compiled JavaScript code. This is done because for every pull request in this repository, we automatically [add it as a local dependency to the Brigade worker (that is a dependency that is local to the repository)][local-deps], and use the GitHub library to test itself.

While this is not common or idiomatic for TypeScript projects, it is the easiest way to test the libraries in this repo for each pull request, so please include the `out/` directory when submitting a pull request.

## Signed commits

A DCO sign-off is required for contributions to repos in the brigadecore org. See the documentation in
[Brigade's Contributing guide](https://github.com/brigadecore/brigade/blob/master/CONTRIBUTING.md#signed-commits)
for how this is done.

[brigade-json]: https://docs.brigade.sh/topics/dependencies/#add-custom-dependencies-using-a-brigade-json-file
[local-deps]: https://docs.brigade.sh/topics/dependencies/#using-local-dependencies-from-the-project-repository
[npm]: https://www.npmjs.com/package/@brigadecore/brigade-utils
[checks-api]: https://developer.github.com/v3/checks/
[gh-app]: https://github.com/brigadecore/brigade-github-app
[kind]: https://github.com/kubernetes-sigs/kind
[kind-getting-started]: https://kind.sigs.k8s.io/docs/user/quick-start/
