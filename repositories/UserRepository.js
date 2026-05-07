class UserRepository {
  constructor() {
    this.users = new Map();
  }

  create(user) {
    this.users.set(user.id, user);

    return user;
  }

  getById(userId) {
    return this.users.get(userId);
  }

  exists(userId) {
    return this.users.has(userId);
  }

  getAll() {
    return [...this.users.values()];
  }
}

module.exports = UserRepository;
