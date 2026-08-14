import { transactions } from "./transactions.js";

import {
  totalByType,
  getCredits,
  getDebits,
  formatReceipts,
  updateTransaction
} from "./report.js";

const credits = getCredits(transactions);
const debits = getDebits(transactions);

console.log("=== TeleBirr Transaction Report ===");

console.log(`Credits: ${totalByType(transactions, "credit")} ETB`);
console.log(`Debits: ${totalByType(transactions, "debit")} ETB`);

console.log("\nCredits:");
console.log(formatReceipts(credits));

console.log("\nDebits:");
console.log(formatReceipts(debits));

const original = transactions[0];
const corrected = updateTransaction(original, 300);

console.log("\nOriginal transaction:");
console.log(original);

console.log("\nCorrected transaction:");
console.log(corrected);