#!/bin/sh
# Database backup script — run via cron in production
BACKUP_DIR=/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"
# Keep only last 30 backups
ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +31 | xargs -r rm
echo "Backup completed: backup_${TIMESTAMP}.sql.gz"
