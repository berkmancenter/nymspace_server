const { Document } = require("mongoose");

/**
 * Update a Mongoose document with properties from a request body, for update/PUT routes.
 * It will update properties on the source document, but otherwise not change the document.
 * This allows the API to receive partial objects for update.
 * @param {Object} incomingObj
 * @param {Document} document
 * @returns {Document}
 */
 const updateDocument = (incomingObj, document) => {
    Object.keys(incomingObj).forEach((prop) => {
        if (prop !== 'id') {
            console.log('Found prop to update:', prop);
            document[prop] = incomingObj[prop];
        }
    });

    return document;
};
  
  module.exports = updateDocument;