"""
Transactional email — urgent-signal alerts and the account-request nudges
(payment link, re-access). All sent through Brevo's HTTPS REST API, not
raw SMTP: Render blocks outbound SMTP ports (587/25) at the network level,
so smtplib connections there hang until they time out and never send.
The HTTP API goes over normal port 443, same as any other outbound fetch.

Best-effort, not best-practice: sent synchronously in the same request
that triggered it, no retry queue. That's a deliberate simplicity choice
for this scale (CLAUDE.md: no infrastructure before it's needed) — if it
fails, the underlying record (decision, requested_plan) is still saved;
only the notification is lost.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger(__name__)

URGENT_CONFIDENCE_THRESHOLD = 0.8

ACTION_LABELS = {
    "reorder_now": "Reorder now",
    "escalate_supplier": "Escalate supplier",
    "shift_to_backup_supplier": "Shift to backup supplier",
}

PLAN_LABELS = {"starter": "Starter ($20/mo)", "growth": "Growth ($100/mo)", "enterprise": "Enterprise ($200/mo)"}

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


def _send_email(to_email: str, subject: str, body: str, reply_to: str | None = None) -> bool:
    """Returns True if Brevo accepted the send. Never raises — a failed
    notification should never take down the request that triggered it."""
    if not (settings.brevo_api_key and settings.smtp_sender_email):
        logger.warning("Email not sent (Brevo API key not configured): %s", subject)
        return False

    payload: dict = {
        "sender": {"email": settings.smtp_sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": body,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}

    req = urllib.request.Request(
        BREVO_SEND_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": settings.brevo_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10):
            return True
    except urllib.error.HTTPError as e:
        logger.error("Brevo rejected email to %s: %s %s", to_email, e.code, e.read().decode(errors="replace"))
        return False
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


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


def send_reaccess_request(user_email: str, plan: str) -> bool:
    """A lapsed user asking, from /access-expired, to be re-approved on a
    given plan starting next month."""
    plan_label = PLAN_LABELS.get(plan, plan)
    subject = f"Re-access request: {user_email}"
    body = (
        f"{user_email}'s access has expired and they're asking to be re-approved.\n\n"
        f"Requested plan (starting next month): {plan_label}\n\n"
        "Review and grant access from the admin command center."
    )
    return _send_email(settings.admin_notify_email, subject, body, reply_to=user_email)


def send_payment_link_request(user_email: str, plan: str | None) -> bool:
    """A still-pending user nudging the admin to send them a payment link
    before their account has even been approved."""
    plan_line = f"Requested plan: {PLAN_LABELS.get(plan, plan)}\n\n" if plan else ""
    subject = f"Payment link requested: {user_email}"
    body = (
        f"{user_email} is waiting for approval and is asking for a payment link.\n\n"
        f"{plan_line}"
        "Review and grant access from the admin command center."
    )
    return _send_email(settings.admin_notify_email, subject, body, reply_to=user_email)


def send_urgent_alert(to_email: str, action_type: str, entity_name: str, confidence: float, evidence: dict) -> bool:
    """Returns True if actually sent. Silently (but loudly in logs) skips
    if Brevo isn't configured — never raises, since a failed notification
    should never take down the decision-creation request that triggered it."""
    label = ACTION_LABELS.get(action_type, action_type)
    subject = f"⚠ {label}: {entity_name}"
    body = _compose_body(action_type, entity_name, evidence) + (
        f"\n\nConfidence: {confidence * 100:.0f}%.\nReview it in your Foresight dashboard."
    )
    return _send_email(to_email, subject, body)
