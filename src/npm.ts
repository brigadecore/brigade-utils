import { Job } from "@brigadecore/brigadier";
import { Project } from "@brigadecore/brigadier/out/events";

const nodeImage = "node:12.3.1-stretch"
const defaultReleaseTagRegex = /^refs\/tags\/v([0-9]+(?:\.[0-9]+)*(?:\-.+)?)$/;

export class NPM extends Job {

    public releaseTagRegex: RegExp;
    public buildJob: Job;
    public version: string;
    public project: Project;

    constructor(name: string, build: Job, version: string, project: Project, image?: string, releaseRegex?: RegExp) {
        super(name, image);

        this.buildJob = build;
        this.version = version;
        this.project = project;

        if (image != undefined) {
            this.image = image;
        } else {
            this.image = nodeImage;
        }

        if (releaseRegex != undefined) {
            this.releaseTagRegex = releaseRegex;
        } else {
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