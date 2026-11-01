export const totalByType = (txns, type) =>
  txns
    .filter(({ type: transactionType }) => transactionType === type)
    .reduce((sum, { amount }) => sum + amount, 0);

export const getCredits = txns =>
  txns.filter(({ type }) => type === "credit");

export const getDebits = txns =>
  txns.filter(({ type }) => type === "debit");

export const formatReceipts = txns =>
  txns.map(
    ({ customer, amount }) =>
      `${customer}: ${amount} ETB`
  );

export const updateTransaction = (transaction, newAmount) => ({
  ...transaction,
  amount: newAmount
});