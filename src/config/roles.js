const allRoles = {
  user: ['createMessage', 'userTopics', 'createTopic', 'createThread', 'userThreads'],
  admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
