export interface Event {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed?: boolean;
  }>;
}

export interface Contract {
  name: string;
  address: string;
  events: Event[];
}

export interface SubgraphData {
  contracts: Contract[];
}

// Strongly typed shape for subgraph.yaml
export interface SubgraphYaml {
  specVersion: string;
  schema?: { file: string };
  dataSources?: DataSource[];
}

export interface DataSource {
  kind?: string;
  name: string;
  network?: string;
  source: {
    address?: string;
    abi?: string;
    startBlock?: number;
  };
  mapping: Mapping;
}

export interface Mapping {
  kind?: string;
  apiVersion?: string;
  language?: string;
  entities?: string[];
  abis?: Array<{ name: string; file: string }>;
  eventHandlers?: EventHandler[];
  file?: string;
}

export interface EventHandler {
  event: string;
  handler: string;
}

