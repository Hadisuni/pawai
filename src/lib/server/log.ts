// Structured logging via stdout/stderr — Vercel captures both automatically
// under Project > Logs, so this needs no external account or SDK. One line
// of JSON per event keeps it greppable without a log-aggregation service.

type Fields = Record<string, unknown>;

function line(level: 'info' | 'error', scope: string, message: string, fields?: Fields) {
  return JSON.stringify({ level, scope, message, ...fields, ts: new Date().toISOString() });
}

export function logInfo(scope: string, message: string, fields?: Fields) {
  console.log(line('info', scope, message, fields));
}

export function logError(scope: string, message: string, err?: unknown, fields?: Fields) {
  const errFields = err instanceof Error ? { errorMessage: err.message } : err ? { error: String(err) } : {};
  console.error(line('error', scope, message, { ...errFields, ...fields }));
}
