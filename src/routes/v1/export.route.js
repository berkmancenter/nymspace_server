const express = require('express')
const exportController = require('../../controllers/export.controller')
const { auth } = require('../../middlewares/auth')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export endpoints
 */

/**
 * @swagger
 * /export/thread/{threadId}:
 *   get:
 *     description: Export thread data (thread owner only)
 *     tags: [Export]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         description: The ID of the thread to export
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         description: Export format (docx or csv)
 *         schema:
 *           type: string
 *           enum: [docx, csv]
 *           default: docx
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Forbidden - not thread owner
 *       404:
 *         description: Thread not found
 */
router.route('/thread/:threadId').get(auth('exportOwnThread'), exportController.exportThread)

module.exports = router