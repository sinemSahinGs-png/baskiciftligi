import { context, trace } from "@opentelemetry/api";

type LogLevel = "debug" | "info" | "warn" | "error";
type SafeLogValue = string | number | boolean | null | undefined;

export interface LogFields {
  [key: string]: SafeLogValue;
}

const blockedKeys = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "card",
  "modelUrl",
  "signedUrl",
]);

function sanitize(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      blockedKeys.has(key) ? "[REDACTED]" : value,
    ]),
  );
}

function write(level: LogLevel, message: string, fields: LogFields = {}) {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "octo-studio-web",
    traceId: spanContext?.traceId,
    spanId: spanContext?.spanId,
    ...sanitize(fields),
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug") {
    if (process.env.NODE_ENV !== "production") {
      console.debug(line);
    }
  } else {
    console.info(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) =>
    write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) =>
    write("error", message, fields),
};
