"""add lectures table

Revision ID: 002_add_lectures_table
Revises: 001_initial_phase1_tables
Create Date: 2026-08-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_add_lectures_table'
down_revision: Union[str, None] = '001_initial_phase1_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lectures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('faculty_id', sa.Integer(), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('storage_path', sa.String(length=512), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='uploaded', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['faculty_id'], ['faculty.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lectures_id'), 'lectures', ['id'], unique=False)
    op.create_index(op.f('ix_lectures_subject_id'), 'lectures', ['subject_id'], unique=False)
    op.create_index(op.f('ix_lectures_batch_id'), 'lectures', ['batch_id'], unique=False)
    op.create_index(op.f('ix_lectures_faculty_id'), 'lectures', ['faculty_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_lectures_faculty_id'), table_name='lectures')
    op.drop_index(op.f('ix_lectures_batch_id'), table_name='lectures')
    op.drop_index(op.f('ix_lectures_subject_id'), table_name='lectures')
    op.drop_index(op.f('ix_lectures_id'), table_name='lectures')
    op.drop_table('lectures')
