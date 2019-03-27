import { Job } from "@azure/brigadier";

export class O365Job extends Job {

    /**
     * @param message - message body to be posted in O365/Teams channel
     * @param o365Webhook -O365/Teams webhook. Highly recommended to store this as a Brigade secret
     * @param o365NotifyImage - container image of the job. Defaults to "dgkanatsios/o365-notify:latest"
     */

    constructor(message: string, o365Webhook: string, o365NotifyImage = "dgkanatsios/o365-notify:latest") {
        super(`${name}-o365-notify`, o365NotifyImage);
        this.env = {
            O365_WEBHOOK: o365Webhook,
            O365_MESSAGE: message,
        };

        this.tasks = ["./o365-notify"];
    }
}

// to be used with this project: https://github.com/dgkanatsios/o365-notify
