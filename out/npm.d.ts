import { Job } from "@brigadecore/brigadier";
export declare const npmReleaseImg = "brigadecore/npm-release:edge";
export declare class NPMReleaseJob extends Job {
    constructor(name: string, image?: string);
}
