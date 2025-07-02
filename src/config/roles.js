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
  admin: ['getUsers', 'manageUsers']
}

const roles = Object.keys(allRoles)
const roleRights = new Map(Object.entries(allRoles))

module.exports = {
  roles,
  roleRights
}
