import createGraph from 'ngraph.graph';
import { BlockMessage } from './types';

const pageRank = require('ngraph.pagerank');

const graph = createGraph({ multigraph: true });

let rankResults: any;
let rankedAtBlockId: string;
let rankedAtHeight: number;

graph.addLink(
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZY=',
  {
    block_height: 0,
  },
);

const blockHeightIdMap: Map<number, string> = new Map([
  [0, '00000000ac160efd705be65b11969c82a5841576ffc0d0923389a78cb3d494cb'],
]);

export const handleBlock = (block_id: string, block: BlockMessage['block']) => {
  const block_height = block.header.height;

  if (blockHeightIdMap.has(block_height)) {
    return;
  }

  blockHeightIdMap.set(block_height, block_id);

  block.transactions.forEach((tx) => {
    graph.addLink(tx.from, tx.to, {
      block_height,
    });
  });

  rankedAtBlockId = block_id;
  rankedAtHeight = block_height;
};

export const processData = () => {
  rankResults = pageRank(graph, 1.0);

  console.log(rankResults);

  console.log('ranked at block id: ', rankedAtBlockId);
  console.log('ranked at block height: ', rankedAtHeight);
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
    rankedAtHeight,
  };
};
