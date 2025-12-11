# Change: Auto-login to POS Cashier Interface

## Why
Currently, when employees log into the Odoo system, they are directed to the backend dashboard instead of the Point of Sale (POS) interface. This creates an extra step for employees who primarily work with the POS system, reducing efficiency. The aim is to redirect employees with cashier roles directly to the POS cashier interface upon login.

## What Changes
- Modify the login redirection logic to check user roles
- Automatically redirect users with cashier/POS permissions to the POS interface after successful login
- Maintain the existing behavior for other types of users who should remain in the backend

## Impact
- Affected specs: User authentication and role management, POS accessibility
- Affected code: Authentication logic, user redirect mechanisms
- User experience enhancement for POS cashiers