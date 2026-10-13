'use strict';

const models = require('../models');
const { formatCurrency, formatMajor } = require('../utils/money');
const config = require('../config/env');

/**
 * Reconcile every account against its ledger entries.
 *
 * For each account: sum(CREDIT) - sum(DEBIT) must equal ledger_balance.
 * Also verifies that every completed double-entry transaction (TRANSFER or
 * BONUS) has exactly two ledger entries (one DEBIT and one CREDIT) of equal
 * amount and currency.
 */
async function runReconciliation() {
  const sequelize = models.sequelize;

  const totals = await sequelize.query(
    `SELECT account_id,
            COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0) AS credits,
            COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0) AS debits
       FROM ledger_entries
      GROUP BY account_id`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const accounts = await models.BankAccount.findAll({
    attributes: ['id', 'accountNumber', 'accountName', 'ledgerBalance', 'currency'],
  });

  const totalsByAccount = new Map();
  const rows = Array.isArray(totals) ? totals : [];
  for (const row of rows) {
    totalsByAccount.set(row.account_id, row);
  }

  const accountResults = [];
  let inconsistent = 0;

  for (const account of accounts) {
    const t = totalsByAccount.get(account.id);
    const credits = BigInt(t ? t.credits : 0);
    const debits = BigInt(t ? t.debits : 0);
    const computed = credits - debits;
    const stored = BigInt(account.ledgerBalance);
    const difference = computed - stored;
    const consistent = difference === 0n;
    if (!consistent) inconsistent += 1;

    accountResults.push({
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      currency: account.currency,
      ledgerBalance: stored.toString(),
      computedBalance: computed.toString(),
      credits: credits.toString(),
      debits: debits.toString(),
      difference: difference.toString(),
      consistent,
    });
  }

  const malformedTransfers = await sequelize.query(
    `SELECT t.id, t.reference,
            COUNT(le.id) AS entry_count,
            COALESCE(SUM(CASE WHEN le.direction = 'DEBIT' THEN le.amount ELSE 0 END), 0) AS debit_total,
            COALESCE(SUM(CASE WHEN le.direction = 'CREDIT' THEN le.amount ELSE 0 END), 0) AS credit_total
       FROM transactions t
       LEFT JOIN ledger_entries le ON le.transaction_id = t.id
      WHERE t.status = 'COMPLETED' AND t.type IN ('TRANSFER', 'BONUS')
      GROUP BY t.id, t.reference
     HAVING COUNT(le.id) <> 2
         OR SUM(CASE WHEN le.direction = 'DEBIT' THEN le.amount ELSE 0 END)
            <> SUM(CASE WHEN le.direction = 'CREDIT' THEN le.amount ELSE 0 END)`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const malformed = Array.isArray(malformedTransfers) ? malformedTransfers : [];

  return {
    generatedAt: new Date(),
    accountsChecked: accountResults.length,
    accountsInconsistent: inconsistent,
    consistent: inconsistent === 0 && malformed.length === 0,
    malformedTransferCount: malformed.length,
    malformedTransfers: malformed,
    accounts: accountResults,
  };
}

function formatReport(report) {
  const minorUnits = config.banking.minorUnits;
  return {
    ...report,
    accounts: report.accounts.map((a) => ({
      ...a,
      ledgerBalanceFormatted: formatCurrency(a.ledgerBalance, a.currency, minorUnits),
      computedBalanceFormatted: formatCurrency(a.computedBalance, a.currency, minorUnits),
      differenceFormatted: formatCurrency(a.difference < 0n ? -BigInt(a.difference) : a.difference, a.currency, minorUnits),
      ledgerBalanceMajor: formatMajor(a.ledgerBalance, minorUnits),
      computedBalanceMajor: formatMajor(a.computedBalance, minorUnits),
    })),
  };
}

module.exports = { runReconciliation, formatReport };
