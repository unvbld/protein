## Context
In Odoo 17, users typically land on the backend dashboard after login regardless of their role. For POS cashiers, this creates an extra step of navigation to reach the POS interface. This design addresses automatically redirecting POS users to the cashier interface.

## Goals / Non-Goals
- Goals:
  - Automatically redirect POS cashiers to the POS interface upon login
  - Maintain existing behavior for non-POS users
  - Preserve security and access controls
- Non-Goals:
  - Modify general user authentication process
  - Change permissions system fundamentally

## Decisions
- Decision: Override Odoo's login redirect mechanism using a custom module
  - Reason: This approach minimally impacts the core system while achieving the goal
  - Implementation: Extend the session authentication method to check user permissions
- Decision: Use POS Cashier role/group as the determining factor for redirection
  - Reason: This group already represents users who should access POS primarily
  - Alternative considered: Configurable redirect destinations per user - rejected as overly complex for initial implementation

## Risks / Trade-offs
- Risk: Unintended redirection of users who occasionally use POS but primarily work in backend
  - Mitigation: Clearly document the behavior and provide admin override options in future iterations

## Migration Plan
1. Install the custom module in the Odoo instance
2. Ensure users who should have POS access are assigned to the POS Cashier group
3. Test with various user types to ensure behavior is correct
4. Monitor for any unintended side effects

## Open Questions
- Should we allow admins to configure which interface a user lands on?
- Should we consider adding a "return to backend" option for POS users who need it?