import { Job } from "@brigadecore/brigadier";
import { Project } from "@brigadecore/brigadier/out/events";
export declare class NPM extends Job {
    releaseTagRegex: RegExp;
    buildJob: Job;
    version: string;
    project: Project;
    constructor(name: string, build: Job, version: string, project: Project, image?: string, releaseRegex?: RegExp);
}
