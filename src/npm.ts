import { Job } from "@brigadecore/brigadier";

export const npmReleaseImg = "brigadecore/npm-release:edge";

export class NPMReleaseJob extends Job {
  constructor(name: string, image?: string) {
    if (image == undefined) {
      image = npmReleaseImg;
    }
    super(name, image);

    let checkEnv = '\
      if [ -z "$NPM_TOKEN" ]; then \
        echo "NPM_TOKEN for npm release must be provided via job environment" && exit 1 ; \
      fi ; \
      if [ -z "$VERSION" ]; then \
        echo "VERSION for npm release must be provided via job environment" && exit 1 ; \
      fi ; '

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