const crypto = require('crypto');
const { saveMessage } = require('~/models');
const { sendMessage, sendError } = require('~/server/utils');
const { getResponseSender } = require('~/server/services/Endpoints');

/**
 * Denies a request by sending an error message and optionally saves the user's message.
 *
 * @async
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} [req.body.messageId] - The ID of the message.
 * @param {string} [req.body.conversationId] - The ID of the conversation.
 * @param {string} [req.body.parentMessageId] - The ID of the parent message.
 * @param {string} req.body.text - The text of the message.
 * @param {Object} res - Express response object.
 * @param {string} errorMessage - The error message to be sent.
 * @returns {Promise<Object>} A promise that resolves with the error response.
 * @throws {Error} Throws an error if there's an issue saving the message or sending the error.
 */
const denyRequest = async (req, res, errorMessage) => {
  let responseText = errorMessage;
  if (typeof errorMessage === 'object') {
    responseText = JSON.stringify(errorMessage);
  }

  const { messageId, conversationId: _convoId, parentMessageId, text } = req.body;
  const conversationId = _convoId ?? crypto.randomUUID();

  const userMessage = {
    sender: 'User',
    messageId: messageId ?? crypto.randomUUID(),
    parentMessageId,
    conversationId,
    isCreatedByUser: true,
    text,
  };
  sendMessage(res, { message: userMessage, created: true });

  const shouldSaveMessage =
    _convoId && parentMessageId && parentMessageId !== '00000000-0000-0000-0000-000000000000';

  if (shouldSaveMessage) {
    await saveMessage({ ...userMessage, user: req.user.id });
  }

  return await sendError(res, {
    sender: getResponseSender(req.body),
    messageId: crypto.randomUUID(),
    conversationId,
    parentMessageId: userMessage.messageId,
    text: responseText,
    shouldSaveMessage,
    user: req.user.id,
  });
};

module.exports = denyRequest;
