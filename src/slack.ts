import { Job } from "@azure/brigadier";

export class SlackJob extends Job {

    /**
     *
     * @param name - name of the job that will be created
     * @param title - title of the message to be posted in Slack
     * @param message - message body to be posted in Slack
     * @param slackWebhook -Slack webhook. Highly recommended to store this as a Brigade secret
     * @param username - username of the message posted in Slack
     * @param slackColor - message color
     * @param slackNotifyImage - container image of the job. Defaults to "technosophos/slack-notify:latest"
     */
    constructor(name: string, title: string, message: string, slackWebhook: string, username: string, slackColor = "#00ff00", slackNotifyImage = "technosophos/slack-notify:latest") {
        super(`${name}-slack-notify`, slackNotifyImage);
        this.env = {
            SLACK_WEBHOOK: slackWebhook,
            SLACK_USERNAME: username,
            SLACK_TITLE: title,
            SLACK_MESSAGE: message,
            SLACK_COLOR: slackColor
        };

        this.tasks = ["/slack-notify"];
    }
}
