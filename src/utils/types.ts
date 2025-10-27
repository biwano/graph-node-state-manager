
export interface ContractEventParams {
  name: string;
  type: string;
  indexed?: boolean;
  structName?: string;
  structParams?: Array<ContractEventParams>;
}

export interface ContractEvent {
  name: string;
  params: Array<ContractEventParams>;
}

export interface Contract {
  name: string;
  address: string;
  events: ContractEvent[];
}


