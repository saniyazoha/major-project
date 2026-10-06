"""add subject_glossary and note_embeddings tables

Revision ID: 011_add_phase7_tables
Revises: 010_add_flashcard_progress_table
Create Date: 2026-10-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.models.note_embedding import VectorType

revision: str = '011_add_phase7_tables'
down_revision: Union[str, None] = '010_add_flashcard_progress_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. subject_glossary
    op.create_table(
        'subject_glossary',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('term', sa.String(length=255), nullable=False),
        sa.Column('normalized_term', sa.String(length=255), nullable=False),
        sa.Column('definition', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('subject_id', 'normalized_term', name='uq_subject_glossary_normalized_term')
    )
    op.create_index(op.f('ix_subject_glossary_id'), 'subject_glossary', ['id'], unique=False)
    op.create_index(op.f('ix_subject_glossary_subject_id'), 'subject_glossary', ['subject_id'], unique=False)
    op.create_index(op.f('ix_subject_glossary_normalized_term'), 'subject_glossary', ['normalized_term'], unique=False)

    # 2. note_embeddings
    op.create_table(
        'note_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lecture_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chunk_text', sa.Text(), nullable=False),
        sa.Column('embedding', VectorType(384), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lecture_id'], ['lectures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_note_embeddings_id'), 'note_embeddings', ['id'], unique=False)
    op.create_index(op.f('ix_note_embeddings_lecture_id'), 'note_embeddings', ['lecture_id'], unique=False)
    op.create_index(op.f('ix_note_embeddings_subject_id'), 'note_embeddings', ['subject_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_note_embeddings_subject_id'), table_name='note_embeddings')
    op.drop_index(op.f('ix_note_embeddings_lecture_id'), table_name='note_embeddings')
    op.drop_index(op.f('ix_note_embeddings_id'), table_name='note_embeddings')
    op.drop_table('note_embeddings')

    op.drop_index(op.f('ix_subject_glossary_normalized_term'), table_name='subject_glossary')
    op.drop_index(op.f('ix_subject_glossary_subject_id'), table_name='subject_glossary')
    op.drop_index(op.f('ix_subject_glossary_id'), table_name='subject_glossary')
    op.drop_table('subject_glossary')
