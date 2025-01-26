exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('users', {
    github_id: {
      type: 'text',
      unique: true,
      nullable: true
    },
    github_username: {
      type: 'text',
      nullable: true
    }
  });

  // Create an index on github_id for faster lookups
  pgm.createIndex('users', 'github_id');
}

exports.down = (pgm) => {
  pgm.dropIndex('users', 'github_id');
  pgm.dropColumns('users', ['github_id', 'github_username']);
}