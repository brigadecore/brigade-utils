import { Job } from "@brigadecore/brigadier";

export const kindJobImage = "radumatei/golang-kind:1.11-0.4";

export class Kind {
    job: Job;

    constructor(job?: Job) {
        if (job != null) {
            this.job = job;
        } else {
            this.job = new Job("kind", kindJobImage);
        }

        // kind needs to run as a privileged pod
        this.job.privileged = true;

        // kind needs to add the following volumeMounts to function properly
        // the Brigade project must enable `allowMountHosts`
        this.job.volumeConfig = [
            {
                mount: {
                    name: "modules",
                    mountPath: "/lib/modules",
                    readOnly: true
                },
                volume: {
                    name: "modules",
                    hostPath: {
                        path: "/lib/modules",
                        type: "Directory"
                    }
                }
            },
            {
                mount: {
                    name: "cgroup",
                    mountPath: "/sys/fs/cgroup",
                },
                volume: {
                    name: "cgroup",
                    hostPath: {
                        path: "/sys/fs/cgroup",
                        type: "Directory"
                    }
                }
            },
            {
                mount: {
                    name: "docker-graph-storage",
                    mountPath: "/var/lib/docker",
                },
                volume: {
                    name: "docker-graph-storage",
                    emptyDir: {}
                }
            }
        ];

        // to add your own tasks to this job, use job.tasks.push()
        this.job.tasks = [
            "dockerd-entrypoint.sh &",
            "sleep 20",
            "kind create cluster",
            `export KUBECONFIG="$(kind get kubeconfig-path)"`,

            // this pod is runing inside a Kubernetes cluster
            // unset environment variables pointing to the host cluster
            // even if the service account is limited, and KUBECONFIG is properly set,
            // some operations might still point to the in-cluster configuration
            "unset $(env | grep KUBERNETES_ | xargs)",
            "kubectl cluster-info",

            // the time needed for the control plane to properly start is around 2 minutes
            //
            // TODO: use a kubectl plugin to wait for all pods of the control plane 
            "sleep 150",
        ]
    }
}