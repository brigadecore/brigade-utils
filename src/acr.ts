import { Job } from "@brigadecore/brigadier";

/**
 * ACRBuildJob represents a Brigade Job that builds a container image using ACR
 */
export class ACRBuildJob extends Job {

    /**
    * The constructor returns a new Brigade Job configured to build a container image using ACR
    *
    * @param name - name of the job
    * @param img - container image to be built
    * @param tag - tag of the image
    * @param dir - directory where the container build context cab be found. It requires the Dockerfile to be at the root
    * @param registry - container registry to log in to, and where the image will be pushed
    * @param username - username for the container registry
    * @param token - Azure Service Principal token to log in for the registry. The Service Principal needs to have proper permissions
    * @param tenant - the Azure tenant of the subscription
    * @param azureCli - the Docker image to use for the Azure CLI. Defaults to "microsoft/azure-cli:latest"
    */
    constructor(name: string, img: string, tag: string, dir: string, registry: string, username: string, token: string, tenant: string, azureCli = "microsoft/azure-cli:latest") {
        super(name, azureCli);
        let imgName = img + ":" + tag;
        this.tasks = [
            `az login --service-principal -u ${username} -p ${token} --tenant ${tenant}`,
            `cd ${dir}`,
            `echo '========> building ${img}...'`,
            `az acr build -r ${registry} -t ${imgName} .`,
            `echo '<======== finished building ${img}.'`
        ];
    }
}
