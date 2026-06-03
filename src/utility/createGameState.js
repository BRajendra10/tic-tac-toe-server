function createEmptyState() {
  return {
    board: Array(9).fill(null),
    turn: 'X',
    result: null, // winner info
    players: {},  // clientId -> symbol
  };
}

export { createEmptyState };