import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { EndpointId } from '@layerzerolabs/lz-definitions'

jest.mock('@layerzerolabs/devtools-evm-hardhat', () => ({
    createConnectedContractFactory: jest.fn(),
}))

jest.mock('@layerzerolabs/ua-devtools-evm', () => ({
    createOAppFactory: jest.fn(),
}))

jest.mock('@layerzerolabs/ua-devtools-solana', () => ({
    createOFTFactory: jest.fn(),
}))

jest.mock('@layerzerolabs/devtools', () => {
    const original = jest.requireActual('@layerzerolabs/devtools')
    return { ...original, firstFactory: jest.fn() }
})

import {
    createSolanaConnectionFactory,
    createSdkFactory,
    createSolanaSignerFactory,
} from '@/helpers'
import { OmniSignerSolana, OmniSignerSolanaSquads } from '@/transactions'

const createConnectedContractFactory = require('@layerzerolabs/devtools-evm-hardhat').createConnectedContractFactory as jest.Mock
const createOAppFactory = require('@layerzerolabs/ua-devtools-evm').createOAppFactory as jest.Mock
const createOFTFactory = require('@layerzerolabs/ua-devtools-solana').createOFTFactory as jest.Mock
const firstFactory = require('@layerzerolabs/devtools').firstFactory as jest.Mock

describe('helpers', () => {
    describe('createSolanaConnectionFactory', () => {
        const mainnetUrl = 'http://mainnet.rpc'
        const testnetUrl = 'http://testnet.rpc'

        beforeEach(() => {
            process.env.RPC_URL_SOLANA = mainnetUrl
            process.env.RPC_URL_SOLANA_TESTNET = testnetUrl
        })

        afterEach(() => {
            delete process.env.RPC_URL_SOLANA
            delete process.env.RPC_URL_SOLANA_TESTNET
        })

        it('creates connections using environment variables', async () => {
            const factory = createSolanaConnectionFactory()
            expect((await factory(EndpointId.SOLANA_V2_MAINNET)).rpcEndpoint).toBe(mainnetUrl)
            expect((await factory(EndpointId.SOLANA_V2_TESTNET)).rpcEndpoint).toBe(testnetUrl)
        })
    })

    describe('createSdkFactory', () => {
        beforeEach(() => {
            createConnectedContractFactory.mockReset()
            createOAppFactory.mockReset()
            createOFTFactory.mockReset()
            firstFactory.mockReset()
        })

        it('merges SDK factories using firstFactory', () => {
            const merged = jest.fn()
            const evm = Symbol('evm')
            const sol = Symbol('sol')
            createConnectedContractFactory.mockReturnValue('connected')
            createOAppFactory.mockReturnValue(evm)
            createOFTFactory.mockReturnValue(sol)
            firstFactory.mockReturnValue(merged)

            const user = Keypair.generate().publicKey
            const program = Keypair.generate().publicKey
            const connectionFactory = jest.fn()

            const result = createSdkFactory(user, program, connectionFactory)

            expect(createConnectedContractFactory).toHaveBeenCalled()
            expect(createOAppFactory).toHaveBeenCalledWith('connected')
            expect(createOFTFactory).toHaveBeenCalled()

            const [userFactory, programFactory, connFactoryArg] = createOFTFactory.mock.calls[0]
            expect(userFactory()).toBe(user)
            expect(programFactory()).toBe(program)
            expect(connFactoryArg).toBe(connectionFactory)

            expect(firstFactory).toHaveBeenCalledWith(evm, sol)
            expect(result).toBe(merged)
        })
    })

    describe('createSolanaSignerFactory', () => {
        it('creates OmniSignerSolana by default', async () => {
            const connection = new Connection('http://example.com')
            const connectionFactory = jest.fn().mockResolvedValue(connection)
            const wallet = Keypair.generate()
            const factory = createSolanaSignerFactory(wallet, connectionFactory)
            const signer = await factory(EndpointId.SOLANA_V2_MAINNET)
            expect(signer).toBeInstanceOf(OmniSignerSolana)
        })

        it('creates OmniSignerSolanaSquads when multisig is provided', async () => {
            const connection = new Connection('http://example.com')
            const connectionFactory = jest.fn().mockResolvedValue(connection)
            const wallet = Keypair.generate()
            const multisig = new PublicKey('11111111111111111111111111111111')
            const factory = createSolanaSignerFactory(wallet, connectionFactory, multisig)
            const signer = await factory(EndpointId.SOLANA_V2_TESTNET)
            expect(signer).toBeInstanceOf(OmniSignerSolanaSquads)
        })

        it('throws for non solana endpoints', async () => {
            const connectionFactory = jest.fn()
            const wallet = Keypair.generate()
            const factory = createSolanaSignerFactory(wallet, connectionFactory)
            await expect(factory(EndpointId.ETHEREUM_MAINNET)).rejects.toThrow(
                'Solana signer factory can only create signers for Solana networks.'
            )
        })
    })
})
