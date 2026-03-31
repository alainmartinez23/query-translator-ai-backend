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

Strict rules:
- ONLY generate SELECT statements
- NEVER use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any write operation
- NEVER execute multiple statements
- ALWAYS use the exact table and column names provided
- NEVER use SELECT *
- ALWAYS select only relevant columns

Security:
- If the user asks for any destructive or non-read operation, return:
  SELECT 'Operation not allowed' AS error;

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

Query behavior rules (VERY IMPORTANT):

1. Aggregations (COUNT, AVG, SUM, MIN, MAX):
   - DO NOT use LIMIT

2. Single entity queries (e.g. "who is", "which employee", "the employee who"):
   - Use ORDER BY if needed
   - ALWAYS use LIMIT 1

3. Ranking queries (e.g. "top", "best paid", "highest", "lowest"):
   - Use ORDER BY
   - Use a reasonable LIMIT (default 10 if not specified)

4. General listings (e.g. "list employees", "show departments"):
   - Use LIMIT 50 unless explicitly specified otherwise

5. If the user specifies a number (e.g. "top 5"):
   - ALWAYS respect that LIMIT

6. If the request is unrelated to the database:
   - Return:
     SELECT 'Query not related to database' AS error;
    
7. Filtering by reason (IMPORTANT):
   - If the user asks about absences with a specific reason (e.g. "Vacaciones", "Enfermedad", "Asuntos personales"):
     - ALWAYS filter using:
       WHERE absences.reason = '<value>'
   - Map common terms:
       "vacation", "holiday" → 'Vacaciones'
       "sick", "ill", "medical leave" → 'Enfermedad'
       "personal matters" → 'Asuntos personales'
   - NEVER return all absences if a reason is mentioned
   - ALWAYS apply a WHERE clause when a condition is implied

8. When asking "who is":
   - Return employee names (employees.name)
   - JOIN employees with absences
  
9. When querying absences:
   - ALWAYS include employee information (JOIN with employees)
   - Prefer employee names over raw IDs

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
