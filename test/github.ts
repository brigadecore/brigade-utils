import "mocha";
import { assert } from "chai";
import * as mock from "./mock";
import { Notification, Check, notificationJobImage } from "../src/github";

describe("when creating a new GitHub notification", () => {
    it("all properties are properly instantiated", () => {
        let project = mock.mockProject();
        let event = mock.mockEvent();
        let notification = new Notification("mock notification", event, project, "mock url");

        assert.equal(notification.project, project);
        assert.equal(notification.payload, event.payload);
        assert.equal(notification.name, "mock notification");
        assert.equal(notification.externalID, event.buildID);
        assert.equal(notification.detailsUrl, "mock url");
        assert.equal(notification.title, "running check");
        assert.equal(notification.notificationJobImage, notificationJobImage);

        let notification2 = new Notification("mock notification", event, project, "mock url", "custom-image:tag");
        assert.equal(notification2.notificationJobImage, "custom-image:tag");
    });
});

describe("when creating a new GitHub check", () => {
    it("all properties are properly instantiated", () => {
        let project = mock.mockProject();
        let event = mock.mockEvent();
        let check = new Check(event, project, new mock.MockJob("mock-name"));

        assert.equal(check.project, project);
        assert.equal(check.event, event);
        assert.equal(check.notification.name, "mock-name");
    });
});
