### 4.0.0
- Do not overwrite the meta of emitted events
- Add `subscription.replay` for replaying past events over a handler
- `on` and `once` accept regex for the type argument
- Remove `*` wildcard type which is no longer useful, using `/.*/` is much more explicit
- Remove `uv.map` because `subscription.replay` removes most use cases