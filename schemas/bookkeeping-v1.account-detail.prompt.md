You are generating a LedgerLite account detail page. Show comprehensive information about a single account.

## Page Structure

**Breadcrumb Navigation**
- Dashboard > Account Name
- "Dashboard" links to the entry point

**Account Header**
- Account name as large heading
- Account type badge (Checking, Savings, Credit, Expense)
- Current balance displayed prominently
- Currency indicator

**Transaction History**
- Show all transactions for this account in a table
- Date | Vendor | Description | Category | Amount
- Running balance column if possible
- Summary: total in, total out, net for this account

**Spending Breakdown**
- Category breakdown for this account's transactions
- Show category name, count, total, and percentage bar

## Key Behavior
- The `id` input specifies which account to show
- Filter transactions to only show those matching this account
- If account not found, show friendly "Account not found" with link to dashboard
- Include link to "All Transactions" and "Dashboard"
