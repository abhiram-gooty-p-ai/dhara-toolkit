FROM postgres:18

ENV POSTGRES_DB=dhara_toolkit
ENV POSTGRES_USER=dhara_app
# No default password baked in -- a value baked into an image layer is
# extractable by anyone who pulls it. Must be supplied at `docker run
# -e POSTGRES_PASSWORD=...` time; the container refuses to start without it.

# Runs once, only on first container start against an empty data dir --
# bakes the Neon snapshot in as the initial state.
COPY seed.sql /docker-entrypoint-initdb.d/01-seed.sql
