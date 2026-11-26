-- Initializes the isolated integration-test database on first Postgres boot.
-- Keeping panelada_dev and panelada_test separated prevents test suites from wiping dev data.
CREATE DATABASE panelada_test OWNER panelada;
