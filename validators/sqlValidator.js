const BLOCKED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
  'TRUNCATE', 'CREATE', 'REPLACE', 'EXEC', 'EXECUTE',
  'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK',
];

const DEFAULT_LIMIT = 50;

// Matches LIMIT followed by a number, accounting for optional semicolon at the end
const LIMIT_REGEX = /\bLIMIT\s+\d+/i;
const TRAILING_SEMICOLON_REGEX = /;\s*$/;

function validate(sql) {
  if (typeof sql !== 'string' || sql.trim() === '') {
    throw new SQLValidationError('SQL must be a non-empty string');
  }

  const normalized = sql.trim();

  if (!/^SELECT\b/i.test(normalized)) {
    throw new SQLValidationError('Only SELECT statements are allowed');
  }

  const foundKeyword = BLOCKED_KEYWORDS.find((kw) =>
    new RegExp(`\\b${kw}\\b`, 'i').test(normalized)
  );
  if (foundKeyword) {
    throw new SQLValidationError(`Forbidden keyword detected: ${foundKeyword}`);
  }

  return addLimitIfMissing(normalized);
}

function addLimitIfMissing(sql) {
  if (LIMIT_REGEX.test(sql)) return sql;

  const withoutSemicolon = sql.replace(TRAILING_SEMICOLON_REGEX, '').trimEnd();
  return `${withoutSemicolon} LIMIT ${DEFAULT_LIMIT}`;
}

class SQLValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SQLValidationError';
  }
}

module.exports = { validate, SQLValidationError };
