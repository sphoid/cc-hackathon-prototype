You are generating the LedgerLite transaction ledger page. Show a comprehensive list of all transactions.

## Page Structure

**Page Header**
- Title: "Transaction Ledger" (or "Transactions for {account}" if filtered by account)
- Show total transaction count

**Filter Indicators**
- If `account` or `category` inputs are provided, show active filter chips
- Show "Showing X of Y transactions" count

**Transaction Table**
- Full table: Date | Vendor | Description | Category | Account | Amount
- Amount: credits in green with `+` prefix, debits in red with `-` prefix, monospace font
- Alternating row backgrounds
- Summary row at bottom: total credits, total debits, net

**Navigation**
- Breadcrumb: Dashboard > Transactions
- "Dashboard" links back to the entry point

## Key Behavior
- If `account` input is provided, filter to only that account's transactions
- If `category` input is provided, filter to only that category
- Include link back to dashboard
