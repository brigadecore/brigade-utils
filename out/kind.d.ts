import { Job } from "@brigadecore/brigadier";
export declare const kindJobImage = "brigadecore/golang-kind:1.15.8-v0.10.0";
export declare class KindJob extends Job {
    kubernetesVersion: String;
    constructor(name: string, image?: string, kubernetesVersion?: string);
}
