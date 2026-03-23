"""add source_id and updated_at to user_files

Revision ID: b4e2f9c01d88
Revises: 3150819091d7
Create Date: 2026-03-23

"""
from alembic import op
import sqlalchemy as sa

revision = "b4e2f9c01d88"
down_revision = "3150819091d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_files",
        sa.Column("source_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_user_files_source_id_lectures",
        "user_files", "lectures",
        ["source_id"], ["id"],
        ondelete="SET NULL",
    )
    op.add_column(
        "user_files",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_constraint("fk_user_files_source_id_lectures", "user_files", type_="foreignkey")
    op.drop_column("user_files", "source_id")
    op.drop_column("user_files", "updated_at")
