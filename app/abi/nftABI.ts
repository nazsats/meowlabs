export const nftABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
  },
] as const;