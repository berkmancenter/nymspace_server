const allRoles = {
  user: [
    'createMessage',
    'userTopics',
    'createTopic',
    'deleteTopic',
    'updateTopic',
    'createThread',
    'userThreads',
    'ping',
    'followThread',
    'followTopic',
    'getThread',
    'allTopics',
    'publicThreads',
    'topicThreads',
    'deleteThread',
    'vote',
    'managePseudonym',
    'manageAccount',
    'getUser',
    'updateThread',
    'exportOwnThread',

    // poll roles
    'createPoll',
    'respondPoll',
    'listPolls',
    'inspectPoll',
    'getPollResponses',
    'getPollResponseCounts',

    // hidden message mode roles
    'revealHiddenMessageModeMessages'
  ],
  admin: ['getUsers', 'manageUsers'],
  site_admin: [
    // All user permissions
    'createMessage',
    'userTopics',
    'createTopic',
    'deleteTopic',
    'updateTopic',
    'createThread',
    'userThreads',
    'ping',
    'followThread',
    'followTopic',
    'getThread',
    'allTopics',
    'publicThreads',
    'topicThreads',
    'deleteThread',
    'vote',
    'managePseudonym',
    'manageAccount',
    'getUser',
    'updateThread',
    'exportOwnThread',

    // poll roles
    'createPoll',
    'respondPoll',
    'listPolls',
    'inspectPoll',
    'getPollResponses',
    'getPollResponseCounts',

    // hidden message mode roles
    'revealHiddenMessageModeMessages',

    // All admin permissions
    'getUsers',
    'manageUsers',

    // Site admin specific permissions
    'exportAnyThread',
    'manageAllChannels',
    'manageAllThreads'
  ]
}

const roles = Object.keys(allRoles)
const roleRights = new Map(Object.entries(allRoles))

/**
 * Check if a user is a site administrator
 * @param {Object|String} user - User object or user role string
 * @returns {Boolean}
 */
const isSiteAdmin = (user) => {
  const role = typeof user === 'string' ? user : user?.role
  return role === 'site_admin'
}

/**
 * Check if a user can act as channel owner (either actual owner or site admin)
 * @param {Object} user - User object
 * @param {Object} topic - Topic/channel object
 * @returns {Boolean}
 */
const canActAsChannelOwner = (user, topic) => {
  if (!user || !topic) return false
  
  const isActualOwner = user._id?.toString() === topic.owner?.toString()
  const isSiteAdministrator = isSiteAdmin(user)
  
  return isActualOwner || isSiteAdministrator
}

module.exports = {
  roles,
  roleRights,
  isSiteAdmin,
  canActAsChannelOwner
}
