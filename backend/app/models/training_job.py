from sqlalchemy import Column, DateTime, String, Text, Boolean, ForeignKey, Integer, text
from sqlalchemy.dialects.mysql import INTEGER as MYSQL_INTEGER
from app.db import Base

class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # UNSIGNED để match users.id int(10) unsigned
    requested_by_admin_id = Column(
        MYSQL_INTEGER(unsigned=True),
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(String(20), nullable=False, default="queued")
    sample_ids_json = Column(Text, nullable=False, default="[]")

    include_trained = Column(Boolean, nullable=False, default=False)
    cancel_requested = Column(Boolean, nullable=False, default=False)

    manifest_csv_path = Column(String(512), nullable=True)
    manifest_ids_path = Column(String(512), nullable=True)
    log_path = Column(String(512), nullable=True)
    metadata_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # an toàn hơn cho MySQL
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    __table_args__ = {"mysql_engine": "InnoDB"}
