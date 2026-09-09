"""
Urgent-signal email alerts — the actual reason a busy shop owner would
trust this product: it taps them on the shoulder instead of waiting for
them to remember to check a dashboard. Reuses the same Brevo SMTP
credentials already configured for Supabase Auth emails.

Best-effort, not best-practice: sent synchronously in the same request
that created the decision, no retry queue. That's a deliberate simplicity
choice for this scale (CLAUDE.md: no infrastructure before it's needed) —
if it fails, the decision itself is still saved and visible on the
dashboard; only the notification is lost.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)

URGENT_CONFIDENCE_THRESHOLD = 0.8

ACTION_LABELS = {
    "reorder_now": "Reorder now",
    "escalate_supplier": "Escalate supplier",
    "shift_to_backup_supplier": "Shift to backup supplier",
}


def _compose_body(action_type: str, entity_name: str, evidence: dict) -> str:
    if action_type == "reorder_now":
        remaining = evidence.get("days_of_stock_remaining")
        required = evidence.get("required_days")
        cost = evidence.get("reorder_cost")
        lost = evidence.get("lost_revenue_if_no_action")
        lines = [
            f"{entity_name} has {remaining} days of stock left, but restocking takes {required} days.",
        ]
        if cost is not None and lost is not None:
            lines.append(f"Reordering now costs about ${cost:,.2f}; waiting could cost about ${lost:,.2f} in lost sales.")
        return "\n".join(lines)

    # escalate_supplier / shift_to_backup_supplier
    baseline = evidence.get("baseline_value")
    observed = evidence.get("observed_value")
    return f"{entity_name} usually delivers in {baseline} days, but the last delivery took {observed} days."


PLAN_LABELS = {"starter": "Starter ($20/mo)", "growth": "Growth ($100/mo)", "enterprise": "Enterprise ($200/mo)"}


def send_reaccess_request(user_email: str, plan: str) -> bool:
    """A lapsed user asking, from /access-expired, to be re-approved on a
    given plan starting next month. Same best-effort SMTP pattern as
    send_urgent_alert — if it fails, the request just doesn't reach the
    admin's inbox; nothing else in the product depends on it."""
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password and settings.smtp_sender_email):
        logger.warning("Re-access request not sent (SMTP not configured): %s / %s", user_email, plan)
        return False

    plan_label = PLAN_LABELS.get(plan, plan)
    subject = f"Re-access request: {user_email}"
    body = (
        f"{user_email}'s access has expired and they're asking to be re-approved.\n\n"
        f"Requested plan (starting next month): {plan_label}\n\n"
        "Review and grant access from the admin command center."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_sender_email
    msg["To"] = settings.admin_notify_email
    msg["Reply-To"] = user_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_sender_email, [settings.admin_notify_email], msg.as_string())
        return True
    except Exception:
        logger.exception("Failed to send re-access request email for %s", user_email)
        return False


def send_payment_link_request(user_email: str, plan: str | None) -> bool:
    """A still-pending user nudging the admin to send them a payment link
    before their account has even been approved — same best-effort SMTP
    pattern as the other notify functions."""
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password and settings.smtp_sender_email):
        logger.warning("Payment-link request not sent (SMTP not configured): %s", user_email)
        return False

    plan_line = f"Requested plan: {PLAN_LABELS.get(plan, plan)}\n\n" if plan else ""
    subject = f"Payment link requested: {user_email}"
    body = (
        f"{user_email} is waiting for approval and is asking for a payment link.\n\n"
        f"{plan_line}"
        "Review and grant access from the admin command center."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_sender_email
    msg["To"] = settings.admin_notify_email
    msg["Reply-To"] = user_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_sender_email, [settings.admin_notify_email], msg.as_string())
        return True
    except Exception:
        logger.exception("Failed to send payment-link request email for %s", user_email)
        return False


def send_urgent_alert(to_email: str, action_type: str, entity_name: str, confidence: float, evidence: dict) -> bool:
    """Returns True if actually sent. Silently (but loudly in logs) skips
    if SMTP isn't configured — never raises, since a failed notification
    should never take down the decision-creation request that triggered it."""
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password and settings.smtp_sender_email):
        logger.warning("Urgent alert not sent (SMTP not configured): %s / %s", action_type, entity_name)
        return False

    label = ACTION_LABELS.get(action_type, action_type)
    subject = f"⚠ {label}: {entity_name}"
    body = _compose_body(action_type, entity_name, evidence) + (
        f"\n\nConfidence: {confidence * 100:.0f}%.\nReview it in your Foresight dashboard."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_sender_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_sender_email, [to_email], msg.as_string())
        return True
    except Exception:
        logger.exception("Failed to send urgent alert email to %s", to_email)
        return False
