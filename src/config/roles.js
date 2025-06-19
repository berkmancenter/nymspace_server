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

    // poll roles
    'createPoll',
    'respondPoll',
    'listPolls',
    'inspectPoll',
    'getPollResponses',
    'getPollResponseCounts',

    // hit the button roles
    'revealHitTheButtonHiddenMessages'
  ],
  admin: ['getUsers', 'manageUsers']
}

const roles = Object.keys(allRoles)
const roleRights = new Map(Object.entries(allRoles))

module.exports = {
  roles,
  roleRights
}
