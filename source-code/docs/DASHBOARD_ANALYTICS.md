# Dashboard Analytics — Student Wallet

## Data scope

All dashboard reporting is restricted to the logged-in `user_id`, with the selected month supplied as a validated `YYYY-MM-01` query parameter. PostgreSQL is the sole data source. No schema migration is required.

## Aggregates

- `monthly`: 12 calendar months ending at the selected month, zero-filled by `generate_series` for months without transactions. Switch between last 3, 6 and 12 in the browser.
- `expenseCategories` and `incomeCategories`: nonzero transaction sums joined with the user's own categories; 5 largest categories and an optional aggregate for remaining categories are displayed.
- `cumulative.expense/income`: daily running totals for the selected month and previous month. Future days in the current/future month return `null` to avoid misleading projections; historical months show their full calendar days.
- Net cash flow = recorded income minus recorded expense; net trend is the cumulative sum across the selected window **only**. It is not a bank balance, net worth, or investment value.
- Comparisons return "no comparison" when the previous month is zero, avoiding division by zero and misleading percentage badges.
- Average expense per day uses all elapsed calendar days (for the active month) or total calendar days (for a past month).

## Frontend

`/css/dashboard.css` and `/js/dashboard.js` are loaded only on the `/` dashboard through the EJS head option. SVG visualizations have keyboard-focusable chart elements and hover/focus tooltips, with no external chart library or additional API roundtrips. The original 7-day panel, budget, savings goal, category overview and recent transaction table remain unchanged.

## Security and reliability

- Database queries are parameterized; `user_id` is scoped to the current session.
- Category colors from data are restricted to hexadecimal values before insertion into SVG attributes; descriptions are inserted with DOM `textContent`.
- JSON for the inline application/json data island escapes raw `<` characters to protect against injected script closings.
- No demo data or new secrets are introduced; `.env` must remain local and is excluded from the ZIP.
