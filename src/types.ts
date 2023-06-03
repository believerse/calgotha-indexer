export interface InvBlockMessage {
  block_ids: string[];
}

export interface BlockMessage {
  block_id: string;
  block: {
    header: BlockHeader;
    transactions: Transaction[];
  };
}

export interface BlockIdHeaderPair {
  block_id: string;
  header: BlockHeader;
}

export interface BlockHeader {
  previous: string;
  hash_list_root: string;
  time: number;
  target: string;
  chain_work: string;
  nonce: number;
  height: number;
  transaction_count: number;
}

export interface Transaction {
  from: string;
  to: string;
  memo: string;
  time: number;
  nonce?: number;
  series?: number;
  signature?: string;
}
