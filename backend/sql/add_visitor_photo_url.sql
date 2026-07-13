-- Run manually against the production DB before deploying the backend
-- (spring.jpa.hibernate.ddl-auto=none, no migration tooling in this project).
ALTER TABLE Visitor ADD COLUMN photo_url MEDIUMTEXT NULL;
