import assert from 'assert'

import { Connection, PublicKey } from '@solana/web3.js'

import { EndpointId } from '@layerzerolabs/lz-definitions'
import { UlnProgram } from '@layerzerolabs/lz-solana-sdk-v2'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import {
    createSdkFactory,
    createSolanaConnectionFactory,
    createSolanaSignerFactory,
} from '@layerzerolabs/devtools-solana/helpers'


export function uint8ArrayToHex(uint8Array: Uint8Array, prefix = false): string {
    const hexString = Buffer.from(uint8Array).toString('hex')
    return prefix ? `0x${hexString}` : hexString
}

function formatBigIntForDisplay(n: bigint) {
    return n.toLocaleString().replace(/,/g, '_')
}

export function decodeLzReceiveOptions(hex: string): string {
    try {
        // Handle empty/undefined values first
        if (!hex || hex === '0x') return 'No options set'
        const options = Options.fromOptions(hex)
        const lzReceiveOpt = options.decodeExecutorLzReceiveOption()
        return lzReceiveOpt
            ? `gas: ${formatBigIntForDisplay(lzReceiveOpt.gas)} , value: ${formatBigIntForDisplay(lzReceiveOpt.value)} wei`
            : 'No executor options'
    } catch (e) {
        return `Invalid options (${hex.slice(0, 12)}...)`
    }
}

export async function getSolanaUlnConfigPDAs(
    remote: EndpointId,
    connection: Connection,
    ulnAddress: PublicKey,
    oftStore: PublicKey
) {
    const uln = new UlnProgram.Uln(new PublicKey(ulnAddress))
    const sendConfig = uln.getSendConfigState(connection, new PublicKey(oftStore), remote)

    const receiveConfig = uln.getReceiveConfigState(connection, new PublicKey(oftStore), remote)

    return await Promise.all([sendConfig, receiveConfig])
}

export class DebugLogger {
    static keyValue(key: string, value: any, indentLevel = 0) {
        const indent = ' '.repeat(indentLevel * 2)
        console.log(`${indent}\x1b[33m${key}:\x1b[0m ${value}`)
    }

    static keyHeader(key: string, indentLevel = 0) {
        const indent = ' '.repeat(indentLevel * 2)
        console.log(`${indent}\x1b[33m${key}:\x1b[0m`)
    }

    static header(text: string) {
        console.log(`\x1b[36m${text}\x1b[0m`)
    }

    static separator() {
        console.log('\x1b[90m----------------------------------------\x1b[0m')
    }

    /**
     * Logs an error (in red) and corresponding fix suggestion (in blue).
     * Uses the ERRORS_FIXES_MAP to retrieve text based on the known error type.
     *
     * @param type Required KnownErrors enum member
     * @param errorMsg Optional string message to append to the error.
     */
    static printErrorAndFixSuggestion(type: KnownErrors, errorMsg?: string) {
        const fixInfo = ERRORS_FIXES_MAP[type]
        if (!fixInfo) {
            // Fallback if the error type is not recognized
            console.log(`\x1b[31mError:\x1b[0m Unknown error type "${type}"`)
            return
        }

        // If errorMsg is specified, append it in parentheses
        const errorOutput = errorMsg ? `${type}: (${errorMsg})` : type

        // Print the error type in red
        console.log(`\x1b[31mError:\x1b[0m ${errorOutput}`)

        // Print the tip in green
        console.log(`\x1b[32mFix suggestion:\x1b[0m ${fixInfo.tip}`)

        // Print the info in blue
        if (fixInfo.info) {
            console.log(`\x1b[34mElaboration:\x1b[0m ${fixInfo.info}`)
        }

        // log empty line to separate error messages
        console.log()
    }
}

export enum KnownErrors {
    // variable name format: <DOMAIN>_<REASON>
    // e.g. If the user forgets to deploy the OFT Program, the variable name should be:
    // FIX_SUGGESTION_OFT_PROGRAM_NOT_DEPLOYED
    ULN_INIT_CONFIG_SKIPPED = 'ULN_INIT_CONFIG_SKIPPED',
    SOLANA_DEPLOYMENT_NOT_FOUND = 'SOLANA_DEPLOYMENT_NOT_FOUND',
}

interface ErrorFixInfo {
    tip: string
    info?: string
}

export const ERRORS_FIXES_MAP: Record<KnownErrors, ErrorFixInfo> = {
    [KnownErrors.ULN_INIT_CONFIG_SKIPPED]: {
        tip: 'Did you run `npx hardhat lz:oft:solana:init-config --oapp-config <LZ_CONFIG_FILE_NAME> --solana-eid <SOLANA_EID>` ?',
        info: 'You must run lz:oft:solana:init-config once before you run lz:oapp:wire. If you have added new pathways, you must also run lz:oft:solana:init-config again.',
    },
    [KnownErrors.SOLANA_DEPLOYMENT_NOT_FOUND]: {
        tip: 'Did you run `npx hardhat lz:oft:solana:create` ?',
        info: 'The Solana deployment file is required to run config tasks. The default path is ./deployments/solana-<mainnet/testnet>/OFT.json',
    },
}
