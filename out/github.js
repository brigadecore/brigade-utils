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
        this.notification.conclusion = Conclusion.Neutral;
        this.notification.title = `Run ${this.job.name}`;
        if (this.event.revision != null) {
            this.notification.summary = `Running ${this.job.name} target for ${this.event.revision.commit}`;
        }
        return this.notification.wrap(this.job);
    }
}
exports.Check = Check;
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
    constructor(name, event, project, detailsUrl, notificationJobImage) {
        this.detailsUrl = "";
        this.notificationJobImage = "deis/brigade-github-check-run:latest";
        this.project = project;
        this.payload = event.payload;
        this.name = name;
        this.externalID = event.buildID;
        this.title = "running check";
        this.text = "";
        this.summary = "";
        if (notificationJobImage != null) {
            this.notificationJobImage = notificationJobImage;
        }
        if (detailsUrl != null) {
            this.detailsUrl = detailsUrl;
        }
        // count allows us to send the notification multiple times, with a distinct pod name
        // each time.
        this.count = 0;
        this.conclusion = Conclusion.Neutral;
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
})(Conclusion = exports.Conclusion || (exports.Conclusion = {}));
//# sourceMappingURL=github.js.map