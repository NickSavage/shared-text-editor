/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    // Add expires_at column to documents table
    pgm.addColumn('documents', {
        expires_at: {
            type: 'timestamp with time zone',
            allowNull: true,
        },
    });

    // Create an index on expires_at for faster querying of expired documents
    pgm.createIndex('documents', 'expires_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    // Remove the index first
    pgm.dropIndex('documents', 'expires_at');
    
    // Then remove the column
    pgm.dropColumn('documents', 'expires_at');
};
