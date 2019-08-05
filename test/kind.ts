
import "mocha";
import { assert } from "chai";
import { Kind, kindJobImage } from "../src/kind";

describe("when creating a new Kind job", () => {
    it("all properties are properly set", () => {
        let kind = new Kind();

        assert.equal(kind.job.image, kindJobImage);
        assert.equal(kind.job.name, "kind");
        assert.isTrue(kind.job.privileged);

        assert.equal(kind.job.tasks.length, 7);
        assert.equal(kind.job.volumeConfig.length, 3);

        assert.equal(kind.job.volumeConfig[0]!.mount!.name, "modules");
        assert.equal(kind.job.volumeConfig[0]!.mount!.mountPath, "/lib/modules");
        assert.equal(kind.job.volumeConfig[0]!.volume!.name, "modules");
        assert.equal(kind.job.volumeConfig[0]!.volume!.hostPath!.path, "/lib/modules");
        assert.equal(kind.job.volumeConfig[0]!.volume!.hostPath!.type, "Directory");

        assert.equal(kind.job.volumeConfig[1]!.mount!.name, "cgroup");
        assert.equal(kind.job.volumeConfig[1]!.mount!.mountPath, "/sys/fs/cgroup");
        assert.equal(kind.job.volumeConfig[1]!.volume!.name, "cgroup");
        assert.equal(kind.job.volumeConfig[1]!.volume!.hostPath!.path, "/sys/fs/cgroup");
        assert.equal(kind.job.volumeConfig[1]!.volume!.hostPath!.type, "Directory");

        assert.equal(kind.job.volumeConfig[2]!.mount!.name, "docker-graph-storage");
        assert.equal(kind.job.volumeConfig[2]!.mount!.mountPath, "/var/lib/docker");
        assert.equal(kind.job.volumeConfig[2]!.volume!.name, "docker-graph-storage");
        assert.deepEqual(kind.job.volumeConfig[2]!.volume!.emptyDir, {});

        kind.job.tasks.push("new-task");
        assert.equal(kind.job.tasks.length, 8);
    });
});