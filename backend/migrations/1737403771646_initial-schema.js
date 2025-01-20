/* eslint-disable camelcase */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = pgm => {
    // Enable UUID extension
    pgm.createExtension('uuid-ossp', { ifNotExists: true });

    // Create users table
    pgm.createTable('users', {
        id: 'id',
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        username: { type: 'varchar(100)', notNull: true },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        last_login: { type: 'timestamp with time zone' },
    });

    // Create documents table
    pgm.createTable('documents', {
        id: 'id',
        title: { type: 'varchar(255)', notNull: true },
        content: { type: 'text' },
        owner_id: {
            type: 'integer',
            references: 'users',
        },
        share_id: {
            type: 'uuid',
            default: pgm.func('uuid_generate_v4()'),
        },
        visibility: {
            type: 'varchar(20)',
            default: 'private',
        },
        language: { type: 'varchar(50)' },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Create document_collaborators table
    pgm.createTable('document_collaborators', {
        document_id: {
            type: 'integer',
            references: 'documents',
            onDelete: 'cascade',
        },
        user_id: {
            type: 'integer',
            references: 'users',
            onDelete: 'cascade',
        },
        access_level: {
            type: 'varchar(20)',
            notNull: true,
            default: 'read',
        },
        joined_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.addConstraint('document_collaborators', 'document_collaborators_pkey', {
        primaryKey: ['document_id', 'user_id'],
    });

    // Create document_history table
    pgm.createTable('document_history', {
        id: 'id',
        document_id: {
            type: 'integer',
            references: 'documents',
            onDelete: 'cascade',
        },
        content: { type: 'text', notNull: true },
        changed_by: {
            type: 'integer',
            references: 'users',
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Create updated_at trigger function
    pgm.createFunction(
        'update_updated_at_column',
        [],
        {
            returns: 'trigger',
            language: 'plpgsql',
        },
        `
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        `
    );

    // Create trigger for documents table
    pgm.createTrigger('documents', 'update_documents_updated_at', {
        when: 'BEFORE',
        operation: 'UPDATE',
        level: 'ROW',
        function: 'update_updated_at_column',
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = pgm => {
    // Drop trigger first
    pgm.dropTrigger('documents', 'update_documents_updated_at');
    pgm.dropFunction('update_updated_at_column', []);

    // Drop tables in reverse order
    pgm.dropTable('document_history');
    pgm.dropTable('document_collaborators');
    pgm.dropTable('documents');
    pgm.dropTable('users');

    // Drop extension last
    pgm.dropExtension('uuid-ossp');
};
