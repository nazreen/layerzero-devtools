import type { EndpointId } from '@layerzerolabs/lz-definitions'
import type { OmniPoint } from '@layerzerolabs/utils'
import type { OmniContract } from '@layerzerolabs/utils-evm'

export interface OmniPointHardhat {
    eid: EndpointId
    contractName?: string | null
    address?: string | null
}

export interface OmniNodeHardhat<TNodeConfig> {
    contract: OmniPointHardhat | OmniPoint
    config: TNodeConfig
}

export interface OmniEdgeHardhat<TEdgeConfig> {
    from: OmniPointHardhat | OmniPoint
    to: OmniPointHardhat | OmniPoint
    config: TEdgeConfig
}

export interface OmniGraphHardhat<TNodeConfig = unknown, TEdgeConfig = unknown> {
    contracts: OmniNodeHardhat<TNodeConfig>[]
    connections: OmniEdgeHardhat<TEdgeConfig>[]
}

export type OmniContractFactoryHardhat = (point: OmniPointHardhat) => OmniContract | Promise<OmniContract>