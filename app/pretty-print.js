/* eslint-disable security/detect-object-injection */
/**
 * @fileoverview Handles pretty printing for logality, used in
 *  local development.
 */
const chalk = require('chalk');
const format = require('json-format');

const { isObjectEmpty, safeStringify } = require('./utils');

const pretty = (module.exports = {});

/** @const {Object} LEVELS_CONFIG Levels colors and icons */
const LEVELS_CONFIG = {
  emergency: {
    color: chalk.red.underline,
    icon: '●',
  },
  alert: {
    color: chalk.red.underline,
    icon: '◆',
  },
  critical: {
    color: chalk.red,
    icon: '✖',
  },
  error: {
    color: chalk.red,
    icon: '■',
  },
  warn: {
    color: chalk.yellow,
    icon: '⚠',
  },
  notice: {
    color: chalk.cyan,
    icon: '▶',
  },
  info: {
    color: chalk.blue,
    icon: 'ℹ',
  },
  debug: {
    color: chalk.green,
    icon: '★',
  },
};

/**
 * Write prettified log to selected output.
 *
 * @param {Object} logContext The log context to write.
 * @param {boolean|Object} prettyOpts Possible pretty print options.
 * @return {string} Formatted output.
 * @private
 */
pretty.writePretty = function (logContext, prettyOpts) {
  // current level icon and color
  const config = LEVELS_CONFIG[logContext.level];

  const noTimestamp = !!prettyOpts?.noTimestamp;
  const noFilename = !!prettyOpts?.noFilename;
  const onlyMessage = !!prettyOpts?.onlyMessage;

  const file = noFilename
    ? ''
    : ` ${chalk.underline.green(logContext.context.source.file_name)}`;
  const date = noTimestamp ? '' : chalk.white(`[${logContext.dt}] `);
  const level = config.color(`${config.icon} ${logContext.level}`);
  const message = config.color(logContext.message);
  const logs = onlyMessage ? '' : pretty._getLogs(logContext);

  const output = `${date}${level}${file} - ${message}\n${logs}`;

  return output;
};

/**
 * Returns formatted logs for pretty print.
 *
 * @param {Object} logContext The log context to format.
 * @return {string} Log output.
 * @private
 */
pretty._getLogs = function (logContext) {
  const logs = {};
  const blacklist = ['runtime', 'source', 'system'];
  const { event, context } = logContext;

  // remove unnecessary keys
  blacklist.forEach((key) => {
    delete context[key];
  });
  delete event.http_request;

  // set event if exists
  if (!isObjectEmpty(event)) {
    logs.event = event;
  }

  // set context
  if (!isObjectEmpty(context)) {
    logs.context = context;
  }

  // empty string if the logs are emtpy
  if (isObjectEmpty(logs)) {
    return '';
  }

  // Perform a safe serialization so that any BigInt values are safely serialized
  // into strings, and then deserialize back to object.
  //
  // The performance hit can be afforded when pretty printing as it is only
  // used on development.
  const logsSerialized = safeStringify(logs);
  const logsSafe = JSON.parse(logsSerialized);

  const prettyLogs = format(logsSafe, { type: 'space', size: 2 });

  return `${prettyLogs}\n`;
};
