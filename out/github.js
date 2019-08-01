"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const brigadier_1 = require("@brigadecore/brigadier");
class Check {
    constructor(event, project, job, detailsURL, notification) {
        this.event = event;
        this.project = project;
        this.job = job;
        if (notification != null) {
            this.notification = notification;
        }
        else {
            this.notification = new Notification(this.job.name, event, project, detailsURL);
        }
    }
    run() {
        this.notification.title = `Run ${this.job.name}`;
        if (this.event.revision != null) {
            this.notification.summary = `Running ${this.job.name} target for ${this.event.revision.commit}`;
        }
        return this.notification.wrap(this.job);
    }
    // handleIssueComment handles an issue_comment event, parsing the comment text.
    // If the comment text is "/brig run", the passed handler is executed
    static handleIssueComment(e, p, handle) {
        console.log("handling issue comment....");
        const payload = JSON.parse(e.payload);
        // Extract the comment body and trim whitespace
        const comment = payload.body.comment.body.trim();
        // Here we determine if a comment should provoke an action
        switch (comment) {
            // Currently, the do-all '/brig run' comment is supported,
            // for (re-)triggering the default Checks suite
            case "/brig run":
                return handle(e, p);
            default:
                console.log(`No applicable action found for comment: ${comment}`);
        }
    }
}
exports.Check = Check;
// Whenever https://github.com/brigadecore/brigade-github-app releases a new version for the check run image, this should be updated
exports.notificationJobImage = "brigadecore/brigade-github-check-run:v0.1.0";
/**
 * Notification is an object sent to the GitHub Checks API to indicate the start / fisnish of a check run.
 */
class Notification {
    /**
     * @param name - name of the Job that will be created
     * @param event - Brigade event
     * @param project - Brigade project
     * @param detailsUrl - URL where build details can be found (visible in the GitHub UI)
     * @param notificationJobImage - optional container image that executes the notification
     */
    constructor(name, event, project, detailsUrl, image) {
        this.detailsUrl = "";
        this.notificationJobImage = exports.notificationJobImage;
        this.project = project;
        this.payload = event.payload;
        this.name = name;
        this.externalID = event.buildID;
        this.title = "running check";
        this.text = "";
        this.summary = "";
        if (image != null) {
            this.notificationJobImage = image;
        }
        if (detailsUrl != null) {
            this.detailsUrl = detailsUrl;
        }
        // count allows us to send the notification multiple times, with a distinct pod name
        // each time.
        this.count = 0;
        this.conclusion = Conclusion.InProgress;
    }
    // Send a new notification, and return a Promise<result>.
    send() {
        this.count++;
        var j = new brigadier_1.Job(`${this.name}-${this.count}`, this.notificationJobImage);
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
        };
        return j.run();
    }
    /**
    * Helper to wrap a job execution between two notifications.
    *
    * @param job - Brigade job to run
    * @param notification - notification object to use
    * @param conclusion - conclusion of the run
    */
    wrap(job) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send();
            try {
                let res = yield job.run();
                this.conclusion = Conclusion.Success;
                this.summary = `Task "${job.name}" passed`;
                this.text = "```" + res.toString() + "```\nTest Complete";
                return yield this.send();
            }
            catch (e) {
                const logs = yield job.logs();
                this.conclusion = Conclusion.Failure;
                this.summary = `Task "${job.name}" failed for ${e.buildID}`;
                this.text = "```" + logs + "```\nFailed with error: " + e.toString();
                try {
                    return yield this.send();
                }
                catch (e2) {
                    console.error("failed to send notification: " + e2.toString());
                    console.error("original error: " + e.toString());
                    return e2;
                }
            }
        });
    }
}
exports.Notification = Notification;
/**
 * Accepted conclusions by the GitHub Checks API
 */
var Conclusion;
(function (Conclusion) {
    Conclusion["Success"] = "success";
    Conclusion["Failure"] = "failure";
    Conclusion["Neutral"] = "neutral";
    Conclusion["Cancelled"] = "cancelled";
    Conclusion["TimedOut"] = "timed_out";
    // this sets the status of the check run to "in_progress"
    Conclusion["InProgress"] = "";
})(Conclusion = exports.Conclusion || (exports.Conclusion = {}));
//# sourceMappingURL=github.js.map