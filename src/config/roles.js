const allRoles = {
  user: [
    'createMessage',
    'userTopics',
    'createTopic',
    'createThread',
    'userThreads',
    'ping',
    'followThread',
    'getThread',
    'publicTopics',
    'publicThreads',
    'deleteThread',
    'upVote',
    'downVote',
    'managePseudonym',
  ],
  admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
