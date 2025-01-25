/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
    ADD COLUMN reset_token VARCHAR(255) UNIQUE,
    ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
    DROP COLUMN reset_token,
    DROP COLUMN reset_token_expires;
  `);
};
