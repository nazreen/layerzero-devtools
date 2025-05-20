import assert from 'assert'

import { ConnectionFactory, createConnectionFactory, createRpcUrlFactory } from './connection'
import { OmniSignerSolana, OmniSignerSolanaSquads } from './transactions'
import {
    type OmniPoint,
    type OmniSigner,
    type OmniTransactionReceipt,
    type OmniTransactionResponse,
    firstFactory,
    formatEid,
} from '@layerzerolabs/devtools'
import { createConnectedContractFactory } from '@layerzerolabs/devtools-evm-hardhat'
import { ChainType, EndpointId, endpointIdToChainType } from '@layerzerolabs/lz-definitions'
import { createOAppFactory } from '@layerzerolabs/ua-devtools-evm'
import { createOFTFactory } from '@layerzerolabs/ua-devtools-solana'
import { IOApp } from '@layerzerolabs/ua-devtools'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

export const createSolanaConnectionFactory = (): ConnectionFactory =>
    createConnectionFactory(
        createRpcUrlFactory({
            [EndpointId.SOLANA_V2_MAINNET]: process.env.RPC_URL_SOLANA,
            [EndpointId.SOLANA_V2_TESTNET]: process.env.RPC_URL_SOLANA_TESTNET,
        })
    )

export const createSdkFactory = (
    userAccount: PublicKey,
    programId: PublicKey,
    connectionFactory = createSolanaConnectionFactory()
) => {
    const evmSdkfactory = createOAppFactory(createConnectedContractFactory())
    const solanaSdkFactory = createOFTFactory(
        () => userAccount,
        () => programId,
        connectionFactory
    )

    return firstFactory<[OmniPoint], IOApp>(evmSdkfactory, solanaSdkFactory)
}

export const createSolanaSignerFactory = (
    wallet: Keypair,
    connectionFactory = createSolanaConnectionFactory(),
    multisigKey?: PublicKey
) => {
    return async (
        eid: EndpointId
    ): Promise<OmniSigner<OmniTransactionResponse<OmniTransactionReceipt>>> => {
        assert(
            endpointIdToChainType(eid) === ChainType.SOLANA,
            `Solana signer factory can only create signers for Solana networks. Received ${formatEid(eid)}`
        )

        return multisigKey
            ? new OmniSignerSolanaSquads(eid, await connectionFactory(eid), multisigKey, wallet)
            : new OmniSignerSolana(eid, await connectionFactory(eid), wallet)
    }
}

