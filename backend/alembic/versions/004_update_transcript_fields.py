"""update transcript fields

Revision ID: 004_update_transcript_fields
Revises: 003_add_transcripts_table
Create Date: 2026-08-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_update_transcript_fields'
down_revision: Union[str, None] = '003_add_transcripts_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('transcripts') as batch_op:
        batch_op.alter_column('transcript_text', new_column_name='raw_text')
        batch_op.add_column(sa.Column('corrected_text', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('segment_timestamps_json', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('transcripts') as batch_op:
        batch_op.drop_column('segment_timestamps_json')
        batch_op.drop_column('corrected_text')
        batch_op.alter_column('raw_text', new_column_name='transcript_text')
