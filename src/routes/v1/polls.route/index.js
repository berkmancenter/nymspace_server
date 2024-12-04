const express = require('express')
const auth = require('../../../middlewares/auth')
const pollsController = require('../../../controllers/poll.controller')
// const pollValidation = require('../../validations/poll.validation')
// const validate = require('../../middlewares/validate')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Poll
 *   description: Interact with application Polls
 */

/**
 * @swagger
 * /polls:
 *   post:
 *     summary: Create single select closed poll
 *     description: Create single select closed poll
 *     operationId: createSingleSelectClosedPoll
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowNewChoices:
 *                 type: boolean
 *                 example: false
 *               choices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: Choice 1
 *                 example:
 *                   - text: Choice 1
 *                   - text: Choice 2
 *                   - text: Choice 3
 *               choicesVisible:
 *                 type: boolean
 *                 example: true
 *               description:
 *                 type: string
 *                 example: Poll description here
 *               expirationDate:
 *                 type: string
 *                 example: '2024-11-20'
 *               multiSelect:
 *                 type: boolean
 *                 example: false
 *               responseCountVisible:
 *                 type: boolean
 *                 example: true
 *               threshold:
 *                 type: number
 *                 example: 10
 *               title:
 *                 type: string
 *                 example: Vote count visible poll
 *               topicId:
 *                 type: string
 *                 example: '{{defaultTopic}}'
 *           examples:
 *             Create multiselect open poll:
 *               value:
 *                 allowNewChoices: true
 *                 choicesVisible: true
 *                 description: Poll description here
 *                 expirationDate: '2024-11-20'
 *                 multiSelect: true
 *                 threshold: 10
 *                 title: Multiselect open poll
 *                 topicId: '{{defaultTopic}}'
 *             Create multiselect open poll with hidden choices:
 *               value:
 *                 allowNewChoices: true
 *                 choicesVisible: false
 *                 description: Poll description here
 *                 expirationDate: '2024-11-20'
 *                 multiSelect: true
 *                 threshold: 10
 *                 title: My poll
 *                 topicId: '{{defaultTopic}}'
 *             Create poll with threshold 1 and past expiration:
 *               value:
 *                 allowNewChoices: false
 *                 choices:
 *                   - text: Choice 1
 *                   - text: Choice 2
 *                   - text: Choice 3
 *                 choicesVisible: true
 *                 description: Poll description here
 *                 expirationDate: '2024-10-20'
 *                 multiSelect: false
 *                 threshold: 1
 *                 title: Single select closed poll
 *                 topicId: '{{defaultTopic}}'
 *             Create poll with visible response count:
 *               value:
 *                 allowNewChoices: false
 *                 choices:
 *                   - text: Choice 1
 *                   - text: Choice 2
 *                   - text: Choice 3
 *                 choicesVisible: true
 *                 description: Poll description here
 *                 expirationDate: '2024-11-20'
 *                 multiSelect: false
 *                 responseCountVisible: true
 *                 threshold: 10
 *                 title: Vote count visible poll
 *                 topicId: '{{defaultTopic}}'
 *             Create single select closed poll:
 *               value:
 *                 allowNewChoices: false
 *                 choices:
 *                   - text: Choice 1
 *                   - text: Choice 2
 *                   - text: Choice 3
 *                 choicesVisible: true
 *                 description: Poll description here
 *                 expirationDate: '2024-11-20'
 *                 multiSelect: false
 *                 threshold: 10
 *                 title: Single select closed poll
 *                 topicId: '{{defaultTopic}}'
 *     responses:
 *       '200':
 *         description: ''
 */
router.route('/').post(auth('createPoll'), pollsController.createPoll)

/**
 * @swagger
 * /polls/{defaultPoll}/respond:
 *    post:
 *      summary: Respond to poll
 *      description: Respond to poll
 *      operationId: respondToPoll
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                choice:
 *                  type: object
 *                  properties:
 *                    remove:
 *                      type: boolean
 *                      example: true
 *                    text:
 *                      type: string
 *                      example: Choice 1
 *            examples:
 *              Remove response from poll (before expiration):
 *                value:
 *                  choice:
 *                    remove: true
 *                    text: Choice 1
 *              Respond to poll:
 *                value:
 *                  choice:
 *                    text: Choice 1
 *      responses:
 *        '200':
 *          description: ''
 */
router.route('/:pollId/respond').post(auth('respondPoll'), pollsController.respondPoll)

/**
 * @swagger
 * /polls:
 *    get:
 *      summary: List polls
 *      description: List polls
 *      operationId: listPolls
 *      parameters:
 *        - name: allowNewChoices
 *          in: query
 *          schema:
 *            type: string
 *            example: 'true'
 *        - name: _sort
 *          in: query
 *          schema:
 *            type: string
 *            example: '-createdAt'
 *      responses:
 *        '200':
 *          description: ''
 */
router.route('/').get(auth('listPolls'), pollsController.listPolls)

/**
 *
 * @swagger
 * /polls/{defaultPoll}:
 *    get:
 *      summary: Inspect poll
 *      description: Inspect poll
 *      operationId: inspectPoll
 *      requestBody:
 *        content:
 *          application/json:
 *            examples:
 *              Inspect poll:
 *                value: ''
 *      responses:
 *        '200':
 *          description: ''
 */
router.route('/:pollId').get(auth('inspectPoll'), pollsController.inspectPoll)

/**
 * @swagger
 * /polls/{defaultPoll}/responses:
 *    get:
 *      summary: Get poll responses (if possible)
 *      description: Get poll responses (if possible)
 *      operationId: getPollResponsesIfPossible
 *      requestBody:
 *        content:
 *          application/json:
 *            examples:
 *              Get poll responses (if possible):
 *                value: ''
 *      responses:
 *        '200':
 *          description: ''
 *
 */
router.route('/:pollId/responses').get(auth('getPollResponses'), pollsController.getPollResponses)

/**
 * @swagger
 * /polls/{defaultPoll}/responseCounts:
 *    get:
 *      summary: Get poll response counts (if possible)
 *      description: Get poll response counts (if possible)
 *      operationId: getPollResponseCountsIfPossible
 *      requestBody:
 *        content:
 *          application/json:
 *            examples:
 *              Get poll response counts (if possible):
 *                value: ''
 *      responses:
 *        '200':
 *          description: ''
 */
router.route('/:pollId/responseCounts').get(auth('getPollResponseCounts'), pollsController.getPollResponseCounts)

module.exports = router
