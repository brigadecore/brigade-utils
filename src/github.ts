import { BrigadeEvent, Project } from "@brigadecore/brigadier/out/events";
import { Job } from "@brigadecore/brigadier";
import { Result } from "@brigadecore/brigadier/out/job";

/**
 * Notification is an object sent to the GitHub Checks API to indicate the start / fisnish of a check run.
 */
export class Notification {
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

    /**
     * @param name - name of the Job that will be created
     * @param event - Brigade event
     * @param project - Brigade project
     * @param detailsUrl - URL where build details can be found (visible in the GitHub UI)
     */
    constructor(name: string, event: BrigadeEvent, project: Project, detailsUrl: string) {
        this.project = project;
        this.payload = event.payload;
        this.name = name;
        this.externalID = event.buildID;
        this.detailsUrl = detailsUrl;
        this.title = "running check";
        this.text = "";
        this.summary = "";

        // count allows us to send the notification multiple times, with a distinct pod name
        // each time.
        this.count = 0;
        this.conclusion = Conclusion.Neutral;
    }

    // Send a new notification, and return a Promise<result>.
    run(): Promise<Result> {
        this.count++;
        var j = new Job(`${this.name}-${this.count}`, "deis/brigade-github-check-run:latest");
        j.imageForcePull = true;
        j.env = {
            CHECK_CONCLUSION: this.conclusion,
            CHECK_NAME: this.name,
            CHECK_TITLE: this.title,
            CHECK_PAYLOAD: this.payload,
            CHECK_SUMMARY: this.summary,
            CHECK_TEXT: this.text,
            CHECK_DETAILS_URL: this.detailsUrl,
            CHECK_EXTERNAL_ID: this.externalID
        }
        return j.run();
    }
}

/**
* Helper to wrap a job execution between two notifications.
*
* @param job - Brigade job to run
* @param notification - Notification object to use
* @param conclusion -
* @param dir - directory where the container build context cab be found. It requires the Dockerfile to be at the root
* @param registry - container registry to log in to, and where the image will be pushed
* @param username - username for the container registry
* @param token - Azure Service Principal token to log in for the registry. The Service Principal needs to have proper permissions
* @param tenant - the Azure tenant of the subscription
* @param azureCli - the Docker image to use for the Azure CLI. Defaults to "microsoft/azure-cli:latest"
*/
export async function WrapNotification(job: Job, notification: Notification, conclusion: Conclusion) {
    if (conclusion == null) {
        conclusion = Conclusion.Success;
    }
    await notification.run();
    try {
        let res = await job.run();
        // const logs = await job.logs();

        notification.conclusion = conclusion;
        notification.summary = `Task "${job.name}" passed`;
        notification.text = notification.text = "```" + res.toString() + "```\nTest Complete";
        return await notification.run();
    } catch (e) {
        const logs = await job.logs();
        notification.conclusion = Conclusion.Failure;
        notification.summary = `Task "${job.name}" failed for ${e.buildID}`;
        notification.text = "```" + logs + "```\nFailed with error: " + e.toString();
        try {
            return await notification.run();
        } catch (e2) {
            console.error("failed to send notification: " + e2.toString());
            console.error("original error: " + e.toString());
            return e2;
        }
    }
}

/**
 * Accepted conclusions by the GitHub Checks API
 */
export enum Conclusion {
    Success = "success",
    Failure = "failure",
    Neutral = "neutral",
    Cancelled = "cancelled",
    TimedOut = "timed_out"
}
