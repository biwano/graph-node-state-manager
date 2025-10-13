export interface ContractEvent {
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
  events: ContractEvent[];
}


