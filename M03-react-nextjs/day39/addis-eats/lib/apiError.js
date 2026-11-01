// The one error shape every endpoint uses.
//
//   { "error": "No such dish" }
//   { "error": "Validation failed", "fieldErrors": { "phone": "Use 09…" } }
//
// Always the key `error`, a sentence a caller can show; `fieldErrors` only
// when there is a field to point at, keyed like validate()'s result. A client
// has one failure branch for every endpoint, and the status code says which
// kind of failure it is before the body is read.
//
// Never a stack trace or a database message: those are logged on the server,
// and the caller gets something they can act on.
export function apiError(status, error, fieldErrors) {
  return Response.json(fieldErrors ? { error, fieldErrors } : { error }, { status });
}
