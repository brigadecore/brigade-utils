"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const brigadier_1 = require("@brigadecore/brigadier");
exports.kindJobImage = "radumatei/golang-kind:1.11-0.4";
class KindJob extends brigadier_1.Job {
    constructor(name, image) {
        if (image == undefined) {
            image = exports.kindJobImage;
        }
        super(name, image);
        // kind needs to run as a privileged pod
        this.privileged = true;
        // since the cluster creation takes some time,
        // set the timeout to 30 minutes
        this.timeout = 180000;
        // kind needs to add the following volumeMounts to function properly
        // the Brigade project must enable `allowHostMounts`
        this.volumes = [
            {
                name: "modules",
                hostPath: {
                    path: "/lib/modules",
                    type: "Directory"
                }
            },
            {
                name: "cgroup",
                hostPath: {
                    path: "/sys/fs/cgroup",
                    type: "Directory"
                }
            },
            {
                name: "docker-graph-storage",
                emptyDir: {}
            }
        ];
        this.volumeMounts = [
            {
                name: "modules",
                mountPath: "/lib/modules",
                readOnly: true
            },
            {
                name: "cgroup",
                mountPath: "/sys/fs/cgroup"
            },
            {
                name: "docker-graph-storage",
                mountPath: "/var/lib/docker"
            }
        ];
        // to add your own tasks to this job, use job.tasks.push()
        this.tasks = [
            // when the pod finishes, regardless of the exit code, delete the cluster
            // to avoid resource leaks
            // see https://github.com/kubernetes-sigs/kind/issues/759
            "trap 'kind delete cluster' EXIT",
            "dockerd-entrypoint.sh &",
            "sleep 20",
            "kind create cluster --wait 300s",
            `export KUBECONFIG="$(kind get kubeconfig-path)"`,
            // this pod is running inside a Kubernetes cluster
            // unset environment variables pointing to the host cluster
            // even if the service account is limited, and KUBECONFIG is properly set,
            // some operations might still point to the in-cluster configuration
            "unset $(env | grep KUBERNETES_ | xargs)",
            "kubectl cluster-info",
            "kubectl get pods --all-namespaces",
            // even though we're using the --wait flag for kind, 
            // some pods (the DNS pods, for example) are not ready yet.
            "sleep 60"
        ];
    }
}
exports.KindJob = KindJob;
//# sourceMappingURL=kind.js.map