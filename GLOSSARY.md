# Glossary

## Express

**Handler**
A function Express calls with `(req, res, next)` to serve a route. "Controller" methods in MapColonies services are handlers.
_Avoid_: controller (when referring to the function itself), middleware (unless it is mounted with `app.use`).

**Redundant try/catch**
A try/catch in a handler whose catch does nothing but pass the caught error, unchanged, to `next`. Express already forwards that error itself, so the try/catch adds nothing.
_Avoid_: pass-through catch.
