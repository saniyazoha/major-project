"""add doubts table

Revision ID: 008_add_doubts_table
Revises: 007_add_quiz_attempts_table
Create Date: 2026-09-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '008_add_doubts_table'
down_revision: Union[str, None] = '007_add_quiz_attempts_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'doubts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('lecture_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('answered_by', sa.Integer(), nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lecture_id'], ['lectures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['answered_by'], ['faculty.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_doubts_id'), 'doubts', ['id'], unique=False)
    op.create_index(op.f('ix_doubts_subject_id'), 'doubts', ['subject_id'], unique=False)
    op.create_index(op.f('ix_doubts_lecture_id'), 'doubts', ['lecture_id'], unique=False)
    op.create_index(op.f('ix_doubts_student_id'), 'doubts', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_doubts_student_id'), table_name='doubts')
    op.drop_index(op.f('ix_doubts_lecture_id'), table_name='doubts')
    op.drop_index(op.f('ix_doubts_subject_id'), table_name='doubts')
    op.drop_index(op.f('ix_doubts_id'), table_name='doubts')
    op.drop_table('doubts')
