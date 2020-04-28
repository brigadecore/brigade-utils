import "mocha";
import { assert } from "chai";
import { NPMReleaseJob } from "../src/npm";

describe("when creating a new NPMReleaseJob", () => {
  it("all default properties are properly instantiated", () => {
    let job = new NPMReleaseJob("npm-release-job");
    assert.equal(job.image, "brigadecore/npm-release:edge");
  });

  it("the image can be overridden", () => {
    let job = new NPMReleaseJob("npm-release-job", "my-npm-image");
    assert.equal(job.image, "my-npm-image");
  });
});