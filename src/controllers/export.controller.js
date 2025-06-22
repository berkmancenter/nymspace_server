const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const catchAsync = require('../utils/catchAsync')
const { exportService } = require('../services')
const Thread = require('../models/thread.model')
const logger = require('../config/logger')

const exportThread = catchAsync(async (req, res) => {
  const { threadId } = req.params
  const { format = 'docx' } = req.query

  req.setTimeout(5 * 60 * 1000)
  res.setTimeout(5 * 60 * 1000)

  const thread = await Thread.findById(threadId)
  if (!thread) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Thread not found')
  }

  if (thread.owner.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only thread owner can export')
  }

  if (!['docx', 'csv'].includes(format)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid format. Use docx or csv')
  }

  try {
    const { buffer, filename, contentType } = await exportService.exportThread(threadId, format, req.user)

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    logger.error('Export error:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to export thread')
  }
})

module.exports = {
  exportThread
}
