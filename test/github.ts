import "mocha";
import { assert } from "chai";
import * as mock from "./mock";
import { Notification, Check, notificationJobImage, GitHubRelease, GITHUB_CHECK_TEXT_MAX_CHARS } from "../src/github";
import { Project } from "@brigadecore/brigadier/out/events";

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

    it("check run text is trimmed appropriately", () => {
      let project = mock.mockProject();
      let event = mock.mockEvent();
      let job = new mock.MockJob("mock-name");
      job.exceedLogLimit = true;
      let check = new Check(event, project, job);

      check.run()
        .then(() => {
          assert.equal(check.notification.text.length, GITHUB_CHECK_TEXT_MAX_CHARS);
          assert.isTrue(check.notification.text.slice(0, 25).includes("(Previous text omitted)\n"));
        });
  });
});

describe("when creating a new GitHubRelease", () => {
  var project:Project;
  var tag:string;

  beforeEach(function() {
    project = mock.mockProject();
    project.secrets = {
      ghToken: "github-token"
    };
    tag = "tag";
  });

  it("an error is returned if secrets.ghToken does not exist", () => {
    project.secrets.ghToken = "";
    let newGitHubRelease = function(){new GitHubRelease(project, tag)};

    assert.throws(newGitHubRelease, "project.secrets.ghToken undefined");
  });

  it("an error is returned if project.repo does not exist", () => {
    project.repo = undefined;
    let newGitHubRelease = function(){new GitHubRelease(project, tag)};

    assert.throws(newGitHubRelease, "project.repo.name undefined");
  });

  it("the default configuration is as expected", () => {
    let gh = new GitHubRelease(project, tag);

    assert.equal(gh.name, "brigadecore-empty-testbed-release");
    assert.equal(gh.image, "brigadecore/gh-release:edge")
    assert.equal(gh.env.GITHUB_TOKEN, project.secrets.ghToken);

    let expectedTasks = [
      `cd /src`,
      `last_tag=$(git describe --tags tag^ --abbrev=0 --always)`,
      `ghr \
        -u brigadecore \
        -r empty-testbed \
        -n "empty-testbed tag" \
        -b "$(git log --no-merges --pretty=format:'- %s %H (%aN)' HEAD ^$last_tag)" \
        tag 
      `
    ];
    assert.deepEqual(gh.tasks, expectedTasks);
  });

  it("configuration overrides are honored", () => {
    let gh = new GitHubRelease(project, tag, "bindir", "workdir");

    assert.equal(gh.name, "brigadecore-empty-testbed-release");
    assert.equal(gh.image, "brigadecore/gh-release:edge");
    assert.equal(gh.env.GITHUB_TOKEN, project.secrets.ghToken);

    let expectedTasks = [
      `cd workdir`,
      `last_tag=$(git describe --tags tag^ --abbrev=0 --always)`,
      `ghr \
        -u brigadecore \
        -r empty-testbed \
        -n "empty-testbed tag" \
        -b "$(git log --no-merges --pretty=format:'- %s %H (%aN)' HEAD ^$last_tag)" \
        tag bindir
      `
    ];
    assert.deepEqual(gh.tasks, expectedTasks);
  });
});
