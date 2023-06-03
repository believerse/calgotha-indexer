import createGraph from 'ngraph.graph';
import { BlockHeader, BlockMessage, Transaction } from './types';

const pageRank = require('ngraph.pagerank');

const graph = createGraph({ multigraph: true });

let rankResults: any;
let rankedAtBlockId: string;

const blockHeightIdMap: Map<number, string> = new Map([
  [0, '00000000ac160efd705be65b11969c82a5841576ffc0d0923389a78cb3d494cb'],
]);
const stagedBlocks: Map<string, BlockMessage['block']> = new Map([
  [
    '00000000ac160efd705be65b11969c82a5841576ffc0d0923389a78cb3d494cb',
    {
      header: {} as BlockHeader,
      transactions: [
        {
          from: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          to: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZY=',
        } as Transaction,
      ],
    },
  ],
]);

export const handleBlock = (block_id: string, block: BlockMessage['block']) => {
  blockHeightIdMap.set(block.header.height, block_id);
  stagedBlocks.set(block_id, block);
};

export const processData = () => {
  for (let [_, block_id] of blockHeightIdMap) {
    const block = stagedBlocks.get(block_id);
    block!.transactions.forEach((tx) => {
      graph.addLink(tx.from, tx.to);
    });

    stagedBlocks.delete(block_id); //remove processed blocks from memory
    rankedAtBlockId = block_id;
  }

  console.log('lastest block: ', getLatestBlock());

  rankResults = pageRank(graph, 1.0);

  console.log(rankResults);
};

export const getLatestBlock = () => {
  return blockHeightIdMap.get(blockHeightIdMap.size - 1);
};

export const getBlockAt = (height: number) => {
  return blockHeightIdMap.get(height);
};

export const getBlockCount = () => {
  return blockHeightIdMap.size;
};

export const getRankFor = (public_key: string) => {
  return {
    public_key,
    rank: rankResults[public_key],
    rankedAtBlockId,
  };
};
