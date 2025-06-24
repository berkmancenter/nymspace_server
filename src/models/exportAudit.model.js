const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')

const exportAuditSchema = mongoose.Schema(
  {
    threadId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
      required: true,
      index: true
    },
    threadName: {
      type: String,
      required: true
    },
    exportedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BaseUser',
      required: true,
      index: true
    },
    exporterUsername: {
      type: String,
      required: true
    },
    format: {
      type: String,
      enum: ['docx', 'csv'],
      required: true
    },
    affectedUsers: [
      {
        userId: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'BaseUser'
        },
        pseudonym: String
      }
    ],
    messageCount: {
      type: Number,
      default: 0
    },
    exportDate: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
)

exportAuditSchema.plugin(toJSON)
exportAuditSchema.plugin(paginate)

exportAuditSchema.index({ 'affectedUsers.userId': 1, exportDate: -1 })

/**
 * @typedef ExportAudit
 */
const ExportAudit = mongoose.model('ExportAudit', exportAuditSchema)

module.exports = ExportAudit
