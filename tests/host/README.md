# Real DSH seeded acceptance data

This private, test-only Host bundle creates a normal idle Session through the
public `workspaceRegistry.create` and `sessionController.create` services and appends deterministic user,
assistant and tool events through the public Session API. The normal DSH
components render those events; the test never inserts fake chat DOM.

Pack with `npm pack ./tests/host --pack-destination .qa`, install that tarball in
the same isolated profile as the plugin under test, and launch with both a fresh
`DSH_HOME` and `DSH_WINE_TEST_SEED=1`. The bundle refuses to start without this
explicit test flag. Wait for `DSH_WINE_SEED_READY`, then click the sidebar row
named `D友の酒 · 本地验收` under `D友の酒 验收工作区`. The Session is
explicitly attached to that registered workspace so the real sidebar can expose it.

The manually assigned title suppresses automatic title generation. No prompt is
submitted, no tool is executed, and no model request is made. Seeded content is
labelled as test data. This directory is excluded from the published plugin.
