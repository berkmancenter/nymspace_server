const { Document, Paragraph, HeadingLevel, Packer } = require('docx')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const archiver = require('archiver')
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const Message = require('../models/message.model')
const User = require('../models/user.model/user.model')
const Thread = require('../models/thread.model')
const ExportAudit = require('../models/exportAudit.model')
const config = require('../config/config')

/**
 * Get exportable messages for a thread (excluding opted-out users)
 * @param {string} threadId - The thread ID
 * @returns {Promise<Array>} Array of messages
 */
const getExportableMessages = async (threadId) => {
  const queryFilter = { thread: threadId }

  if (config.enableExportOptOut) {
    const optedOutUsers = await User.find({
      dataExportOptOut: true
    }).select('_id')

    const optedOutUserIds = optedOutUsers.map((u) => u._id)
    queryFilter.owner = { $nin: optedOutUserIds }
  }

  const messages = await Message.find(queryFilter).populate('owner', 'pseudonyms').sort({ createdAt: 1 })

  return messages.map((msg) => {
    const activePseudonym = msg.owner?.pseudonyms?.find((p) => p.active)
    return {
      _id: msg._id.toString(),
      body: msg.body,
      createdAt: msg.createdAt,
      parentMessage: msg.parentMessage?.toString() || null,
      pseudonym: activePseudonym?.pseudonym || 'Anonymous',
      replies: []
    }
  })
}

/**
 * Build message hierarchy from flat array
 * @param {Array} messages - Flat array of messages
 * @returns {Array} Hierarchical array of messages
 */
const buildMessageHierarchy = (messages) => {
  const messageMap = new Map()
  const rootMessages = []

  messages.forEach((msg) => {
    messageMap.set(msg._id, { ...msg, replies: [] })
  })

  messages.forEach((msg) => {
    if (msg.parentMessage && messageMap.has(msg.parentMessage)) {
      messageMap.get(msg.parentMessage).replies.push(messageMap.get(msg._id))
    } else {
      rootMessages.push(messageMap.get(msg._id))
    }
  })

  return rootMessages
}

/**
 * Format messages for DOCX with proper indentation
 * @param {Array} messages - Hierarchical messages
 * @param {number} level - Indentation level
 * @returns {Array} Array of Paragraph objects
 */
const formatMessagesForDocx = (messages, level = 0) => {
  return messages
    .map((msg) => {
      const indent = level * 720
      const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return [
        new Paragraph({
          text: `${msg.pseudonym} - ${new Date(msg.createdAt).toLocaleString()} (${serverTimezone})`,
          indent: { left: indent },
          spacing: { before: 240 },
          style: 'Heading3'
        }),
        new Paragraph({
          text: msg.body,
          indent: { left: indent },
          spacing: { after: 240 }
        }),
        ...formatMessagesForDocx(msg.replies || [], level + 1)
      ]
    })
    .flat()
}

/**
 * Generate DOCX file from messages
 * @param {Array} messages - Hierarchical messages
 * @param {Object} metadata - Thread metadata
 * @returns {Promise<Buffer>} DOCX file buffer
 */
const generateDocx = async (messages, metadata) => {
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: metadata.threadName,
            heading: HeadingLevel.TITLE
          }),
          new Paragraph({
            text: `Channel: ${metadata.topicName}`,
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            text: `Exported on: ${new Date().toLocaleString()} (${serverTimezone})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 480 }
          }),
          ...formatMessagesForDocx(messages)
        ]
      }
    ]
  })

  return Packer.toBuffer(doc)
}

/**
 * Generate CSV files for messages
 * @param {Array} messages - Flat array of messages
 * @param {Object} metadata - Thread metadata
 * @returns {Promise<Buffer>} ZIP file buffer containing CSV files
 */
const generateCsv = async (messages, metadata) => {
  const tempDir = path.join(os.tmpdir(), `export-${metadata.threadId}-${Date.now()}`)
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(tempDir, { recursive: true })

  try {
    const csvData = messages.map((msg) => ({
      messageId: msg._id,
      pseudonym: msg.pseudonym,
      body: msg.body,
      createdAt: `${new Date(msg.createdAt).toISOString()} (UTC)`,
      parentMessageId: msg.parentMessage || 'root'
    }))

    const csvWriter = createCsvWriter({
      path: path.join(tempDir, 'messages.csv'),
      header: [
        { id: 'messageId', title: 'Message ID' },
        { id: 'pseudonym', title: 'Pseudonym' },
        { id: 'body', title: 'Message' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'parentMessageId', title: 'Parent Message ID' }
      ]
    })

    await csvWriter.writeRecords(csvData)

    const metadataWriter = createCsvWriter({
      path: path.join(tempDir, 'metadata.csv'),
      header: [
        { id: 'threadName', title: 'Thread Name' },
        { id: 'topicName', title: 'Channel Name' },
        { id: 'exportDate', title: 'Export Date' },
        { id: 'messageCount', title: 'Message Count' }
      ]
    })

    await metadataWriter.writeRecords([
      {
        threadName: metadata.threadName,
        topicName: metadata.topicName,
        exportDate: `${new Date().toISOString()} (UTC)`,
        messageCount: messages.length
      }
    ])

    const csvFilePath = path.join(tempDir, 'messages.csv')
    const metadataFilePath = path.join(tempDir, 'metadata.csv')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const messagesContent = await fs.readFile(csvFilePath)
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const metadataContent = await fs.readFile(metadataFilePath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks = []

    const archivePromise = new Promise((resolve, reject) => {
      archive.on('error', reject)
      archive.on('end', resolve)
      archive.on('data', (chunk) => chunks.push(chunk))
    })

    archive.append(messagesContent, { name: 'messages.csv' })
    archive.append(metadataContent, { name: 'metadata.csv' })
    archive.finalize()

    await archivePromise
    await fs.rm(tempDir, { recursive: true, force: true })

    return Buffer.concat(chunks)
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

/**
 * Export thread data
 * @param {string} threadId - Thread ID
 * @param {string} format - Export format (docx or csv)
 * @param {Object} exportingUser - User performing the export
 * @returns {Promise<Object>} Object with buffer and metadata
 */
const exportThread = async (threadId, format = 'docx', exportingUser) => {
  const thread = await Thread.findById(threadId).populate('topic', 'name')
  if (!thread) {
    throw new Error('Thread not found')
  }

  const messages = await getExportableMessages(threadId)
  const affectedUsersMap = new Map()
  const allMessages = await Message.find({ thread: threadId }).populate('owner', 'pseudonyms')

  allMessages.forEach((msg) => {
    if (msg.owner && !affectedUsersMap.has(msg.owner._id.toString())) {
      const activePseudonym = msg.owner.pseudonyms?.find((p) => p.active)
      affectedUsersMap.set(msg.owner._id.toString(), {
        userId: msg.owner._id,
        pseudonym: activePseudonym?.pseudonym || 'Anonymous'
      })
    }
  })

  await ExportAudit.create({
    threadId: thread._id,
    threadName: thread.name,
    exportedBy: exportingUser._id,
    exporterUsername: exportingUser.username || 'Unknown',
    format,
    affectedUsers: Array.from(affectedUsersMap.values()),
    messageCount: messages.length,
    exportDate: new Date()
  })

  const hierarchicalMessages = buildMessageHierarchy(messages)
  const metadata = {
    threadId: thread._id.toString(),
    threadName: thread.name,
    topicName: thread.topic?.name || 'Unknown Channel'
  }
  let buffer
  let filename
  let contentType
  const dateStr = new Date().toISOString().split('T')[0]
  const sanitizedThreadName = thread.slug.replace(/[^a-z0-9-_]/gi, '_')

  if (format === 'csv') {
    buffer = await generateCsv(messages, metadata)
    filename = `${sanitizedThreadName}-messages-${dateStr}.zip`
    contentType = 'application/zip'
  } else {
    buffer = await generateDocx(hierarchicalMessages, metadata)
    filename = `${sanitizedThreadName}-thread-export-${dateStr}.docx`
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  return {
    buffer,
    filename,
    contentType
  }
}

module.exports = {
  exportThread,
  getExportableMessages
}
