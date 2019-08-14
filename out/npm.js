"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const brigadier_1 = require("@brigadecore/brigadier");
const nodeImage = "node:12.3.1-stretch";
const defaultReleaseTagRegex = /^refs\/tags\/v([0-9]+(?:\.[0-9]+)*(?:\-.+)?)$/;
class NPM extends brigadier_1.Job {
    constructor(name, build, version, project, image, releaseRegex) {
        super(name, image);
        this.buildJob = build;
        this.version = version;
        this.project = project;
        if (image != undefined) {
            this.image = image;
        }
        else {
            this.image = nodeImage;
        }
        if (releaseRegex != undefined) {
            this.releaseTagRegex = releaseRegex;
        }
        else {
            this.releaseTagRegex = defaultReleaseTagRegex;
        }
        this.env = {
            "NPM_TOKEN": this.project.secrets.npmToken
        };
        // The steps to publish include the steps to build, and then some, so we'll
        // use the build job steps as a starting point.
        this.tasks = this.buildJob.tasks;
        // If we leave .npmrc at the root of the project with the NPM_TOKEN env var
        // unset, all yarn commands will fail. Since this env var is populated with
        // the correct secret ONLY for this one job, we create .npmrc right here,
        // just in time.
        this.tasks.push("echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc");
        this.tasks.push("sed -i 's/^  \"version\":.*/  \"version\": \"" + version + "\",/' package.json");
        this.tasks.push("npm publish");
    }
}
exports.NPM = NPM;
//# sourceMappingURL=npm.js.map