"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const brigadier_1 = require("@brigadecore/brigadier");
exports.npmReleaseImg = "brigadecore/npm-release:edge";
class NPMReleaseJob extends brigadier_1.Job {
    constructor(name, image) {
        if (image == undefined) {
            image = exports.npmReleaseImg;
        }
        super(name, image);
        let checkEnv = '\
      if [ -z "$NPM_TOKEN" ]; then \
        echo "NPM_TOKEN for npm release must be provided via job environment" && exit 1 ; \
      fi ; \
      if [ -z "$VERSION" ]; then \
        echo "VERSION for npm release must be provided via job environment" && exit 1 ; \
      fi ; ';
        this.tasks = [
            checkEnv,
            "cd ${WORKSPACE}",
            "echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc",
            "cat package.json | jq '.version |= env.VERSION' > package.json.tmp",
            "rm package.json",
            "mv package.json.tmp package.json",
            "npm publish"
        ];
    }
}
exports.NPMReleaseJob = NPMReleaseJob;
//# sourceMappingURL=npm.js.map