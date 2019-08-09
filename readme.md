# Brigade Utils

This repository aims to package frequently used Brigade jobs, allowing us to avoid replicating the same functionality. It is imported as an NPM package in the Brigade worker, and can be used directly in `brigade.js` scripts.

To add this package, [use the `brigade.json` file][brigade-json] in the repository, and add the following package:

```json
{
    "dependencies": {
        "@brigadecore/brigade-utils": "0.3.0"
    }
}
```

> Note that any dependency added here should point the exact version (and not use the tilde `~` and caret `^` to indicate semver compatible versions).

> Use the appropriate version of this library that you can find on NPM - [`@brigadecore/brigade-utils`][npm]


## The GitHub library

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
  var check = new Check(e, p, build());
  check.run();
}

events.on("check_suite:requested", runSuite);
events.on("check_suite:rerequested", runSuite);

// this enables "/brig run" comments from allowed authors to start a check run
events.on("issue_comment:created", (e, p) => Check.handleIssueComment(e, p, runSuite));
```

This script is one that can be used to build this repository.

> Note: `Check.handleIssueComment` currently only handles `/brig run` comments - to add your own, see implementation for this method.

## The Kind library

[Kind][kind] (Kubernetes in Doker) is a tool for creating a local Kubernetes cluster using Docker containers as nodes, nd it is a very fast and covenient way of setting up a Kubernetes cluster for testing.

But while [setting it up locally is straightforward][kind-getting-started], running a Kind cluster inside your Kubernetes cluster (for various end-to-end testing scenarios) is rather difficult. This library abstracts all that, and creating and using a cluster can be easily achieved with Brigade:

```js
const { KindJob } = require("@brigadecore/brigade-utils");

function e2e(event, project) {
    let kind = new KindJob("kind");
    kind.tasks.push(
        // add your end-to-end tests
        "kubectl get pods --all-namespaces"
    );

    return kind;
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
- this is an experimental configuration, which mounts host directories inside a privileged pod - before deploying this at scale on a production cluster, monitor your environment for any resource leaks. We do ensure to delete clusters create with the default configuration (using Linux traps), but overriding that can lead to damage to your cluster (see [this issue](https://github.com/kubernetes-sigs/kind/issues/759))
- this job runs as a privileged pod in your cluster
- the default image used contains `docker`, `go`, `kind`, `git`, `wget`, `apk` - you can supply your own, or you can use `apk`, or download other tools you might need .
- if overriding the default configuration, ensure you are cleaning up clusters created to avoid resource leaks. See [how tasks are configured](./src/kind.ts).


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

Note that this repository *does not* ignore the generated `out/` directory that contains the compiled JavaScript code. This is done because for every pull request in this repository, we automatically [add it as a local dependency to the Brigade worker (that is a dependency that is local to the repository)][local-deps], and use the GitHub library to test itself.

While this is not common or idiomatic for TypeScript projects, it is the easiest way to test the libraries in this repo for each pull request, so please include the `out/` directory when submitting a pull request.

## Signed commits

A DCO sign-off is required for contributions to repos in the brigadecore org.  See the documentation in
[Brigade's Contributing guide](https://github.com/brigadecore/brigade/blob/master/CONTRIBUTING.md#signed-commits)
for how this is done.


[brigade-json]: https://docs.brigade.sh/topics/dependencies/#add-custom-dependencies-using-a-brigade-json-file
[local-deps]: https://docs.brigade.sh/topics/dependencies/#using-local-dependencies-from-the-project-repository
[npm]: https://www.npmjs.com/package/@brigadecore/brigade-utils
[checks-api]: https://developer.github.com/v3/checks/
[gh-app]: https://github.com/brigadecore/brigade-github-app
[kind]: https://github.com/kubernetes-sigs/kind
[kind-getting-started]: https://kind.sigs.k8s.io/docs/user/quick-start/