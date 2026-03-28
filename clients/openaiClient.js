const OpenAI = require('openai');
const { createCircuitBreaker } = require('../resilience/circuitBreaker');

const TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS) || 10000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: TIMEOUT_MS,
});

const SYSTEM_PROMPT = `
You are an expert SQL generator for PostgreSQL.

Given a natural language prompt, return ONLY the SQL query.
- No explanations
- No markdown
- No code blocks

Rules:
- ONLY generate SELECT statements
- NEVER use INSERT, UPDATE, DELETE, DROP, or ALTER
- ALWAYS use the exact table and column names provided
- ALWAYS include a LIMIT 50 at the end unless the query already has a LIMIT

Database schema:

Table departments:
- id
- name

Table employees:
- id
- name
- email
- department_id
- salary
- hired_at

Table absences:
- id
- employee_id
- start_date
- end_date
- reason

Relationships:
- employees.department_id = departments.id
- absences.employee_id = employees.id

Guidelines:
- Use JOINs when necessary
- Use correct foreign key relationships
- Do not invent tables or columns
- Prefer explicit JOIN syntax
`;

async function callOpenAI(prompt) {
  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
  });
  return response.output_text?.trim();
}

const breaker = createCircuitBreaker(callOpenAI);

async function generateSQL(prompt) {
  try {
    const sql = await breaker.fire(prompt);

    console.log('[OpenAI Response]', sql);
    if (!sql) throw new OpenAIError('Empty response from OpenAI');

    if (sql.includes(';')) {
      const trimmed = sql.trim();

      if (!trimmed.endsWith(';')) {
        throw new OpenAIError('Invalid semicolon usage');
      }

      const withoutLast = trimmed.slice(0, -1);

      if (withoutLast.includes(';')) {
        throw new OpenAIError('Multiple statements are not allowed');
      }
    }

    return sql;
  } catch (err) {
    if (err instanceof OpenAIError) {
      console.error('[OPENAI ERROR]', err);
      throw new Error('AI_ERROR');
    }
    if (err.name === 'APIConnectionTimeoutError' || err.code === 'ETIMEDOUT') {
      throw new OpenAIError('OpenAI request timed out', { cause: err });
    }
    if (err.status === 401) {
      throw new OpenAIError('Invalid OpenAI API key', { cause: err });
    }
    if (err.status === 429) {
      throw new OpenAIError('OpenAI rate limit exceeded', { cause: err });
    }
    throw new OpenAIError(`OpenAI request failed: ${err.message}`, { cause: err });
  }
}

class OpenAIError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'OpenAIError';
  }
}

module.exports = { generateSQL, OpenAIError };
