class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  validateUser(userId) {
    const user = this.userRepository.getById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  createUser(user) {
    return this.userRepository.create(user);
  }

  userExists(userId) {
    return Boolean(this.userRepository.getById(userId));
  }

  getUser(userId) {
    return this.userRepository.getById(userId);
  }

  getAllUsers() {
    return this.userRepository.getAll();
  }
}

module.exports = UserService;
