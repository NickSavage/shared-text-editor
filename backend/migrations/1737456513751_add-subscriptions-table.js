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
exports.up = (pgm) => {
    pgm.createTable('subscriptions', {
        id: 'id',
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'CASCADE',
            unique: true,
        },
        stripe_customer_id: {
            type: 'text',
            notNull: true,
        },
        stripe_subscription_id: {
            type: 'text',
            notNull: true,
        },
        status: {
            type: 'text',
            notNull: true,
            default: 'inactive',
        },
        plan_type: {
            type: 'text',
            notNull: true,
        },
        current_period_end: {
            type: 'timestamp',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Add index for faster lookups
    pgm.createIndex('subscriptions', 'user_id');
    pgm.createIndex('subscriptions', 'stripe_customer_id');
    pgm.createIndex('subscriptions', 'stripe_subscription_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('subscriptions');
};
