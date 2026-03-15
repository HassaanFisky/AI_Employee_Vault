"""Database seed script: populates knowledge_base with sample product docs."""
from __future__ import annotations

import asyncio
import json
import uuid
from pathlib import Path

import openai
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from src.config.settings import get_settings

SAMPLE_ARTICLES = [
    {
        "title": "How to Reset Your Password",
        "category": "account",
        "content": """To reset your password:
1. Go to the login page and click 'Forgot Password'.
2. Enter your email address and click 'Send Reset Link'.
3. Check your email (including spam) for a link valid for 24 hours.
4. Click the link and enter a new password (min 12 characters).
5. Log in with your new password.
If you don't receive the email within 5 minutes, contact support.""",
        "source_url": "https://docs.yourapp.com/account/reset-password",
        "tags": ["password", "account", "login"],
    },
    {
        "title": "Billing and Invoice Questions",
        "category": "billing",
        "content": """Your invoices are available in Account > Billing > Invoice History.
We accept Visa, Mastercard, American Express, and PayPal.
Billing occurs on the same date each month (your plan start date).
Annual plans are billed upfront at a 20% discount.
To update your payment method: Account > Billing > Payment Methods.
For refund requests, please contact our billing team at billing@yourapp.com within 30 days.""",
        "source_url": "https://docs.yourapp.com/billing/overview",
        "tags": ["billing", "invoice", "payment", "refund"],
    },
    {
        "title": "API Key Management",
        "category": "technical",
        "content": """To generate an API key:
1. Navigate to Settings > API Keys.
2. Click 'Create New Key' and give it a descriptive name.
3. Copy the key immediately — it won't be shown again.
4. Use the key in the Authorization: Bearer <key> header.
Keys can be scoped (read-only, write, admin).
Rotate keys regularly. Compromised keys can be revoked instantly from the dashboard.
Rate limits: 1,000 req/min (Starter), 10,000 req/min (Pro), unlimited (Enterprise).""",
        "source_url": "https://docs.yourapp.com/api/authentication",
        "tags": ["api", "authentication", "keys", "rate-limit"],
    },
    {
        "title": "Plan Comparison and Upgrades",
        "category": "billing",
        "content": """Plans:
- Free: Up to 3 users, 1GB storage, community support.
- Starter ($29/mo): Up to 10 users, 10GB storage, email support.
- Pro ($99/mo): Up to 50 users, 100GB storage, priority support, API access.
- Enterprise: Unlimited users, custom storage, dedicated CSM, SLA guarantee.
To upgrade: Account > Plan > Change Plan. Upgrades are prorated instantly.
Downgrades take effect at the next billing cycle.""",
        "source_url": "https://docs.yourapp.com/billing/plans",
        "tags": ["pricing", "plans", "upgrade", "downgrade"],
    },
    {
        "title": "Inviting Team Members",
        "category": "account",
        "content": """To invite team members:
1. Go to Settings > Team Members.
2. Click 'Invite Member' and enter their email address.
3. Select their role (Viewer, Editor, Admin).
4. They'll receive an invitation email valid for 7 days.
Roles: Viewer (read-only), Editor (create/edit), Admin (full access including billing).
You can remove members at any time from the same page.""",
        "source_url": "https://docs.yourapp.com/team/invitations",
        "tags": ["team", "invite", "roles", "collaboration"],
    },
    {
        "title": "Data Export and Download",
        "category": "technical",
        "content": """Export your data at any time:
Formats: CSV, JSON, XLSX.
Path: Settings > Data > Export.
Exports are generated asynchronously — you'll receive a download link by email within 15 minutes.
Full account export includes: all records, files, audit logs, team activity.
We comply with GDPR data portability requirements.
Exports are available for 48 hours after generation.""",
        "source_url": "https://docs.yourapp.com/data/export",
        "tags": ["export", "data", "GDPR", "download"],
    },
    {
        "title": "Single Sign-On (SSO) Setup",
        "category": "technical",
        "content": """SSO is available on Pro and Enterprise plans.
Supported protocols: SAML 2.0, OpenID Connect (OIDC).
Supported providers: Okta, Azure AD, Google Workspace, OneLogin.
Setup: Settings > Security > SSO > Configure.
You'll need your IDP's metadata URL or XML file.
Test SSO in sandbox mode before enforcing it for all users.
Contact support@yourapp.com if you need SCIM provisioning.""",
        "source_url": "https://docs.yourapp.com/security/sso",
        "tags": ["SSO", "SAML", "authentication", "enterprise", "security"],
    },
    {
        "title": "Cancellation and Account Deletion",
        "category": "billing",
        "content": """To cancel your subscription:
1. Go to Account > Plan > Cancel Subscription.
2. Your account remains active until the end of the current billing period.
3. Data is retained for 90 days after cancellation.
To permanently delete your account: Settings > Account > Delete Account.
Deletion is irreversible. Download your data before deletion.
Note: Cancellation does not automatically trigger a refund for the current period.""",
        "source_url": "https://docs.yourapp.com/account/cancellation",
        "tags": ["cancellation", "delete", "subscription", "offboarding"],
    },
]


async def seed_knowledge_base() -> None:
    settings = get_settings()
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print(f"Seeding {len(SAMPLE_ARTICLES)} knowledge base articles...")

    async with factory() as session:
        for i, article in enumerate(SAMPLE_ARTICLES, 1):
            # Generate embedding
            response = await client.embeddings.create(
                model=settings.openai_embedding_model,
                input=f"{article['title']}\n\n{article['content']}",
            )
            embedding = response.data[0].embedding

            from src.database.models import KnowledgeBase
            kb_entry = KnowledgeBase(
                id=uuid.uuid4(),
                title=article["title"],
                content=article["content"],
                category=article["category"],
                source_url=article.get("source_url"),
                tags=article.get("tags", []),
                embedding=embedding,
                is_active=True,
            )
            session.add(kb_entry)
            print(f"  [{i}/{len(SAMPLE_ARTICLES)}] Seeded: {article['title']}")

        await session.commit()

    await engine.dispose()
    print("\n✅ Knowledge base seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_knowledge_base())
