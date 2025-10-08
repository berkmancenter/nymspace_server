const { messageService } = require('../services')
const { Thread } = require('../models')
const catchAsync = require('../utils/catchAsync')
const WebsocketError = require('../utils/WebsocketError')
const { checkAuth } = require('./utils')
const logger = require('../config/logger')

module.exports = (io, socket) => {
  const createMessage = async (data) => {
    if (!data) {
      logger.error('No request data.')

      return
    }

    // Store userId on the socket if not already stored
    if (data.user && data.user._id && !socket.data?.userId) {
      socket.data = socket.data || {}
      socket.data.userId = data.user._id.toString()
    }

    try {
      const newMessages = await messageService.newMessageHandler(data.message, data.user)

      for (const message of newMessages) {
        logger.info(
          'Creating message %s via socket for userId %s, thread %s. Message text = "%s"',
          data.request,
          data.user._id,
          message.thread._id.toString(),
          message.body
        )

        message.owner = data.user._id

        if (message.hiddenMessageModeHidden === true) {
          const thread = await Thread.findById(message.thread).populate('topic').exec()
          const channelOwnerId = thread.topic?.owner?.toString()
          const isMessageFromChannelOwner = data.user._id.toString() === channelOwnerId

          // Prepare base message
          const baseMessage = {
            ...message.toJSON(),
            threadMessageCount: message.threadMessageCount,
            request: data.request
          }

          if (isMessageFromChannelOwner) {
            // Channel owner's messages are visible to everyone
            const messageWithLabel = {
              ...baseMessage,
              visibilityLabel: 'Facilitator message. Visible to everyone.'
            }
            io.in(message.thread._id.toString()).emit('message:new', messageWithLabel)
          } else {
            // Non-channel owner's message - need to handle different recipients differently

            // First, send full message to the sender themselves
            const senderMessage = {
              ...baseMessage,
              visibilityLabel: 'Hidden message. Visible only to you and facilitators.'
            }
            socket.emit('message:new', senderMessage)

            // Then handle all other sockets in the room
            const socketsInRoom = await io.in(message.thread._id.toString()).fetchSockets()

            for (const recipientSocket of socketsInRoom) {
              // Skip the sender's socket (we already sent to them above)
              if (recipientSocket.id === socket.id) continue

              const recipientUserId = recipientSocket.data?.userId
              const messageToSend = { ...baseMessage }

              // Check if recipient is the channel owner
              if (recipientUserId && recipientUserId === channelOwnerId) {
                // Channel owner can see all messages
                messageToSend.visibilityLabel = 'Hidden message. Visible only to facilitators and the author.'
              } else {
                // Other participants and unauthenticated users can't see the message
                messageToSend.body = null
                messageToSend.hiddenForUser = true
                messageToSend.visibilityLabel = 'Hidden message. Visible only to facilitators and the author.'
              }

              recipientSocket.emit('message:new', messageToSend)
            }
          }
        } else {
          io.in(message.thread._id.toString()).emit('message:new', {
            ...message.toJSON(),
            threadMessageCount: message.threadMessageCount,
            request: data.request
          })
        }
      }
    } catch (err) {
      logger.error('Error creating message', err)
      // send error back to user
      io.in(data.userId).emit('error', {
        error: 'message:create',
        message: err.message,
        request: data.request,
        statusCode: err.statusCode
      })
    }
  }

  const joinThread = catchAsync(async (data) => {
    logger.debug('Joining thread via socket. ThreadId = %s', data.threadId)
    socket.join(data.threadId.toString())
    // Store userId on socket for later use
    if (data.user) {
      socket.data = socket.data || {}
      // Handle both user._id and user.id cases
      socket.data.userId = (data.user._id || data.user.id || data.user).toString()
    }
  })

  socket.use(([event, args], next) => {
    logger.debug('Checking auth (JWT) for message/thread socket requests.')
    checkAuth(event, args, next)
  })

  socket.on('error', (err) => {
    if (err instanceof WebsocketError) {
      const { data, originalError } = err

      if (!data) {
        logger.error('No error data.')

        return
      }

      logger.info('Socket error - request: %s, user: %s, error: %s', data.request, data.userId, originalError.message)
      io.in(data.userId).emit('error', { error: originalError.message, request: data.request })
    } else {
      logger.error('Socket error', err)
    }
  })

  socket.on('message:create', createMessage)
  socket.on('thread:join', joinThread)
  socket.on('user:join', (data) => {
    if (data.userId) {
      socket.data = socket.data || {}
      socket.data.userId = data.userId
      socket.join(data.userId)
    }
  })
  socket.on('thread:disconnect', () => {
    logger.info('Socket disconnecting from thread.')
    socket.disconnect(true)
  })
  socket.on('disconnect', () => {})
}
