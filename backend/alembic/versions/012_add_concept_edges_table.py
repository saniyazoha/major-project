"""add concept_edges table

Revision ID: 012_add_concept_edges_table
Revises: 011_add_phase7_tables
Create Date: 2026-10-07

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '012_add_concept_edges_table'
down_revision: Union[str, None] = '011_add_phase7_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'concept_edges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lecture_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('source_term', sa.String(length=255), nullable=False),
        sa.Column('target_term', sa.String(length=255), nullable=False),
        sa.Column('relationship_label', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lecture_id'], ['lectures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_concept_edges_id'), 'concept_edges', ['id'], unique=False)
    op.create_index(op.f('ix_concept_edges_lecture_id'), 'concept_edges', ['lecture_id'], unique=False)
    op.create_index(op.f('ix_concept_edges_subject_id'), 'concept_edges', ['subject_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_concept_edges_subject_id'), table_name='concept_edges')
    op.drop_index(op.f('ix_concept_edges_lecture_id'), table_name='concept_edges')
    op.drop_index(op.f('ix_concept_edges_id'), table_name='concept_edges')
    op.drop_table('concept_edges')
