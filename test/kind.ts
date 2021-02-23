import "mocha";
import { assert } from "chai";
import { KindJob, kindJobImage } from "../src/kind";

describe("when creating a new Kind job", () => {
    it("the default timeout represents 30 minutes", () => {
        let kind = new KindJob("kind");

        assert.equal((kind.timeout / (1000 * 60)), 30)
    });

    it("without an image for the job, the default image is used", () => {
        let kind = new KindJob("kind");

        assert.equal(kind.name, "kind");
        assert.equal(kind.image, kindJobImage);
    });

    it("and an image is passed, the image is used", () => {
        let kind = new KindJob("kind", "my-custom-kind-image");

        assert.equal(kind.name, "kind");
        assert.equal(kind.image, "my-custom-kind-image");
    });

    it("without a kubernetes version, the default value is used", () => {
      let kind = new KindJob("kind", "my-custom-kind-image");

      assert.equal(kind.kubernetesVersion, "v1.20.2");
    });

    it("when a kubernetes version is passed, the value is used", () => {
      let kind = new KindJob("kind", "my-custom-kind-image", "v1.0.0");

      assert.equal(kind.kubernetesVersion, "v1.0.0");
    });

    it("job is privileged, with right number of pre-defined tasks", () => {
        let kind = new KindJob("kind");

        assert.isTrue(kind.privileged);
        assert.equal(kind.tasks.length, 11);
    });

    it("all volumes are properly set", () => {
        let kind = new KindJob("kind");
        assert.equal(kind.volumeMounts.length, 3);

        assert.equal(kind.volumes[0].name, "modules");
        assert.equal(kind.volumes[0].hostPath!.path, "/lib/modules");
        assert.equal(kind.volumes[0].hostPath!.type, "Directory");
        assert.equal(kind.volumes[1].name, "cgroup");
        assert.equal(kind.volumes[1].hostPath!.path, "/sys/fs/cgroup");
        assert.equal(kind.volumes[1].hostPath!.type, "Directory");
        assert.equal(kind.volumes[2].name, "docker-graph-storage");
        assert.deepEqual(kind.volumes[2].emptyDir!, {});
    });

    it("all volume mounts are properly set", () => {
        let kind = new KindJob("kind");

        assert.equal(kind.volumeMounts.length, 3);
        assert.equal(kind.volumeMounts[0].name, "modules");
        assert.equal(kind.volumeMounts[0].mountPath, "/lib/modules");
        assert.equal(kind.volumeMounts[1].name, "cgroup");
        assert.equal(kind.volumeMounts[1].mountPath, "/sys/fs/cgroup");
        assert.equal(kind.volumeMounts[2].name, "docker-graph-storage");
        assert.equal(kind.volumeMounts[2].mountPath, "/var/lib/docker");
    });
});