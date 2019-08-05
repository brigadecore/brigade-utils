import { Job } from "@brigadecore/brigadier";
export declare const kindJobImage = "radumatei/golang-kind:1.11-0.4";
export declare class KindJob extends Job {
    constructor(name: string, image?: string);
}
