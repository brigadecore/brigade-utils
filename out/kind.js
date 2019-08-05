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
        // kind needs to add the following volumeMounts to function properly
        // the Brigade project must enable `allowMountHosts`
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
            "dockerd-entrypoint.sh &",
            "sleep 20",
            "kind create cluster",
            `export KUBECONFIG="$(kind get kubeconfig-path)"`,
            "kubectl cluster-info",
            // this pod is runing inside a Kubernetes cluster
            // unset environment variables pointing to the host cluster
            // even if the service account is limited, and KUBECONFIG is properly set,
            // some operations might still point to the in-cluster configuration
            "unset $(env | grep KUBERNETES_ | xargs)",
            // the time needed for the control plane to properly start is around 2 minutes
            //
            // TODO: use a kubectl plugin to wait for all pods of the control plane 
            "sleep 150",
            "kubectl get pods --all-namespaces"
        ];
    }
}
exports.KindJob = KindJob;
//# sourceMappingURL=kind.js.map