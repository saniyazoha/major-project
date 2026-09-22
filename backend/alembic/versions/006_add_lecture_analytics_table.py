"""add lecture_analytics table

Revision ID: 006_add_lecture_analytics_table
Revises: 005_add_generation_tables
Create Date: 2026-09-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_add_lecture_analytics_table'
down_revision: Union[str, None] = '005_add_generation_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lecture_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lecture_id', sa.Integer(), nullable=False),
        sa.Column('avg_wpm', sa.Float(), nullable=False),
        sa.Column('wpm_by_segment_json', sa.Text(), nullable=False),
        sa.Column('word_frequency_json', sa.Text(), nullable=False),
        sa.Column('filler_word_counts_json', sa.Text(), nullable=False),
        sa.Column('keyword_frequency_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lecture_id'], ['lectures.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lecture_id')
    )
    op.create_index(op.f('ix_lecture_analytics_id'), 'lecture_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_lecture_analytics_lecture_id'), 'lecture_analytics', ['lecture_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_lecture_analytics_lecture_id'), table_name='lecture_analytics')
    op.drop_index(op.f('ix_lecture_analytics_id'), table_name='lecture_analytics')
    op.drop_table('lecture_analytics')
