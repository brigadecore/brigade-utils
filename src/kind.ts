import { Job } from "@brigadecore/brigadier";

export const kindJobImage = "brigadecore/golang-kind:1.15.8-v0.10.0";

export class KindJob extends Job {
    kubernetesVersion: String;

    constructor(name: string, image?: string, kubernetesVersion?: string) {
        if (image == undefined) {
            image = kindJobImage;
        }
        super(name, image);

        if (kubernetesVersion == undefined) {
          // set a default for the kind cluster version
          // must be supported by the kind version in the default kindJobImage used
          this.kubernetesVersion = "v1.20.2";
        } else {
          this.kubernetesVersion = kubernetesVersion;
        }

        // kind needs to run as a privileged pod
        this.privileged = true;

        // since the cluster creation takes some time,
        // set the timeout to 30 minutes
        this.timeout = 1800000;

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
            `kind create cluster --image kindest/node:${this.kubernetesVersion} --wait 300s`,
            `kind get kubeconfig > kind-kubeconfig`,
            `chmod 400 kind-kubeconfig`,
            `export KUBECONFIG=$(pwd)/kind-kubeconfig`,
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