"""add quiz_attempts table

Revision ID: 007_add_quiz_attempts_table
Revises: 006_add_lecture_analytics_table
Create Date: 2026-09-24

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_add_quiz_attempts_table'
down_revision: Union[str, None] = '006_add_lecture_analytics_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('selected_answer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'quiz_id', name='uq_student_quiz_attempt')
    )
    op.create_index(op.f('ix_quiz_attempts_id'), 'quiz_attempts', ['id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_student_id'), 'quiz_attempts', ['student_id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_quiz_id'), 'quiz_attempts', ['quiz_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quiz_attempts_quiz_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_student_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_id'), table_name='quiz_attempts')
    op.drop_table('quiz_attempts')
