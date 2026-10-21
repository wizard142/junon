# Outcome

Restore the original dark world, retain the UI and adjustable sizes, and unblock
world creation on the local development stack.

## Context

The current combined server is running. Inspector error history shows
SequelizeAccessDeniedError for the local database account. The environment
brightening was introduced in e0179c1 independently of the UI layout.

## Progress

- [x] 2026-10-21: Diagnose the live database authentication failure.
- [x] Restore original sector, ship and container rendering; retain intro removal.
- [x] Load root .env from Sequelize configuration, including CLI migrations.
- [x] Connect world-size dropdowns to numeric NewColony dimensions; previously ignored.
- [x] User repaired the database account; database connection and CLI migrations pass.
- [x] Reproduce both rectangular flood-fill boundary failures; use column count for columns.
- [x] Verify 64 x 96 creation and dark rendering on the live combined development server with MariaDB.

## Implementation

Restore only rendering source changes from before e0179c1, replace the brightness
regression check with dark rendering and custom size checks, and document local
startup. Database account repair needs the user's sudo authentication.

## Validation

Client build, focused browser checks for custom dimensions, dark rendering and
home copy, plus live database connection and migration checks.

## Decisions

- 2026-10-21: Keep the approved UI geometry and palette. Remove the world filter
  entirely rather than adding a brightness setting.

## Discoveries and risks

The current .env credentials and earlier setup password were both rejected.
The agent cannot authenticate sudo; the user was given database repair SQL.
No saves are deleted or schema migrations rewritten.

The first live custom-size browser run reproduced a terrain flood-fill crash:
column bounds used the row count. Both orientations fail a focused Jest check
before the fix.

## Result

The local database connection and `npm run db:setup` pass. The new rectangular
flood-fill tests fail before the fix and pass afterward; running them alongside
`test/world/grid.test.js` passes all 29 checks. The checked-in
`world_colors.spec.js` passes against the existing combined development server
using a temporary configuration with globalSetup disabled (1 passed). It verifies
64 x 96 dimensions, original dark tint and sprite grouping, and removed intro.
`npm run client:build` passes after the shared flood-fill change (existing
missing-translation warnings remain). JavaScript syntax and `git diff --check`
also pass. No generated assets or credentials are committed.
