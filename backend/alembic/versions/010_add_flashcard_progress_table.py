"""add flashcard_progress table

Revision ID: 010_add_flashcard_progress_table
Revises: 009_add_email_to_users
Create Date: 2026-10-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '010_add_flashcard_progress_table'
down_revision: Union[str, None] = '009_add_email_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'flashcard_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('flashcard_id', sa.Integer(), nullable=False),
        sa.Column('ease_factor', sa.Float(), server_default='2.5', nullable=False),
        sa.Column('interval_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('next_review_date', sa.Date(), nullable=False),
        sa.Column('last_reviewed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['flashcard_id'], ['flashcards.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'flashcard_id', name='uq_student_flashcard_progress')
    )
    op.create_index(op.f('ix_flashcard_progress_id'), 'flashcard_progress', ['id'], unique=False)
    op.create_index(op.f('ix_flashcard_progress_student_id'), 'flashcard_progress', ['student_id'], unique=False)
    op.create_index(op.f('ix_flashcard_progress_flashcard_id'), 'flashcard_progress', ['flashcard_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_flashcard_progress_flashcard_id'), table_name='flashcard_progress')
    op.drop_index(op.f('ix_flashcard_progress_student_id'), table_name='flashcard_progress')
    op.drop_index(op.f('ix_flashcard_progress_id'), table_name='flashcard_progress')
    op.drop_table('flashcard_progress')
