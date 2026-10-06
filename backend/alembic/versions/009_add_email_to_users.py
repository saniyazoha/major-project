"""add email to users

Revision ID: 009_add_email_to_users
Revises: 008_add_doubts_table
Create Date: 2026-09-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '009_add_email_to_users'
down_revision: Union[str, None] = '008_add_doubts_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('faculty', sa.Column('email', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('faculty', 'email')
    op.drop_column('students', 'email')
