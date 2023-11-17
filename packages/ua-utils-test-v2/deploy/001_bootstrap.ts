import { type DeployFunction } from "hardhat-deploy/types"
import { AddressZero } from "@ethersproject/constants"
import assert from "assert"

/**
 * This deploy function will deploy and configure LayerZero endpoint
 *
 * @param env `HardhatRuntimeEnvironment`
 */
const deploy: DeployFunction = async ({ getUnnamedAccounts, deployments, network }) => {
    assert(network.config.endpointId != null, `Missing endpoint ID for network ${network.name}`)

    const [deployer] = await getUnnamedAccounts()
    const endpointV2Deployment = await deployments.deploy("EndpointV2", {
        from: deployer,
        args: [network.config.endpointId, AddressZero],
    })

    console.table({
        EndpointV2: endpointV2Deployment.address,
    })
}

deploy.tags = ["Bootstrap", "EndpointV2"]

export default deploy