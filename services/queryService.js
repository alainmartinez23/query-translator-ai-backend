const { generateSQL, OpenAIError } = require('../clients/openaiClient');
const { executeQuery } = require('../clients/dbClient');
const { validate, SQLValidationError } = require('../validators/sqlValidator');

async function translateAndExecute(prompt) {
  try {
    // Debug
    console.log('[PROMPT]', prompt);

    const rawSQL = await generateSQL(prompt);

    // Debug
    console.log('[RAW SQL]', rawSQL);

    const safeSQL = validate(rawSQL);

    // Debug
    console.log('[SAFE SQL]', safeSQL);

    const rows = await executeQuery(safeSQL);

    // Debug (realmente no quiero que devuelva el sql, no es necesario)
    return { sql: safeSQL, rows };
  } catch (err) {
    if (err instanceof OpenAIError) {
      throw new Error('AI_ERROR');
    }

    if (err instanceof SQLValidationError) {
      throw new Error('INVALID_QUERY');
    }

    throw new Error('INTERNAL_ERROR');
  }
}

module.exports = { translateAndExecute };
