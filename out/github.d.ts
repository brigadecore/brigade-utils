import { BrigadeEvent, EventHandler, Project } from "@brigadecore/brigadier/out/events";
import { Result } from "@brigadecore/brigadier/out/job";
import { Job } from "@brigadecore/brigadier";
export declare class Check {
    event: BrigadeEvent;
    project: Project;
    job: Job;
    notification: Notification;
    constructor(event: BrigadeEvent, project: Project, job: Job, detailsURL?: string, notification?: Notification);
    run(): Promise<any>;
    static handleIssueComment(e: BrigadeEvent, p: Project, handle: EventHandler): void;
}
export declare const notificationJobImage: string;
/**
 * Notification is an object sent to the GitHub Checks API to indicate the start / fisnish of a check run.
 */
export declare class Notification {
    project: Project;
    payload: any;
    name: string;
    externalID: any;
    detailsUrl: string;
    title: string;
    text: string;
    summary: string;
    count: number;
    conclusion: Conclusion;
    notificationJobImage: string;
    /**
     * @param name - name of the Job that will be created
     * @param event - Brigade event
     * @param project - Brigade project
     * @param detailsUrl - URL where build details can be found (visible in the GitHub UI)
     * @param notificationJobImage - optional container image that executes the notification
     */
    constructor(name: string, event: BrigadeEvent, project: Project, detailsUrl?: string, image?: string);
    send(): Promise<Result>;
    /**
    * Helper to wrap a job execution between two notifications.
    *
    * @param job - Brigade job to run
    * @param notification - notification object to use
    * @param conclusion - conclusion of the run
    */
    wrap(job: Job): Promise<any>;
}
/**
 * Accepted conclusions by the GitHub Checks API
 */
export declare enum Conclusion {
    Success = "success",
    Failure = "failure",
    Neutral = "neutral",
    Cancelled = "cancelled",
    TimedOut = "timed_out",
    InProgress = ""
}
