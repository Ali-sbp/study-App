"""add_file_type_practice_content_user_files

Revision ID: 3150819091d7
Revises: acb29d8fb8d0
Create Date: 2026-03-23 08:36:51.000944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '3150819091d7'
down_revision: Union[str, Sequence[str], None] = 'acb29d8fb8d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add file_type with server_default so existing rows get 'lecture'
    op.add_column('lectures', sa.Column(
        'file_type', sa.String(length=16), nullable=False, server_default='lecture'
    ))

    # user_files and practice_content already exist from previous migration


def downgrade() -> None:
    op.drop_table('user_files')
    op.drop_column('lectures', 'file_type')
