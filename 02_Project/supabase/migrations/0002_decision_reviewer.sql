-- Adds the missing audit link: which user actually reviewed a decision.
-- Required by blueprint §11 ("immutable audit events for decision creation,
-- review, approval and closure") — without this, an approved/rejected
-- decision has no record of who acted on it.
--
-- Nullable because a decision starts as 'open' with no reviewer yet; it gets
-- set the moment status moves to 'approved', 'rejected', or 'snoozed'. This
-- is also the first real foreign key into user_account from another table.

alter table decision
  add column reviewed_by_user_id uuid references user_account(user_id);
