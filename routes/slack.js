const express = require('express');
const router = express.Router();
const {
  openApprovalModal,
  handleModalSubmission,
  handleAction
} = require('../utils/slackUtils');

// When slash command is triggered
router.post('/commands', async (req, res) => {
  try {
    const payload = req.body;
    console.log("Slash command received:", payload);

    await openApprovalModal(payload.trigger_id);
    return res.status(200).send(); // Acknowledge request
  } catch (error) {
    console.error("Error in /commands route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Handles modal submit and button click events
router.post('/interactions', async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    console.log("✅ Interaction received:", payload);

    if (payload.type === 'view_submission') {
      await handleModalSubmission(payload);
      return res.status(200).send();
    }

    if (payload.type === 'block_actions') {
      await handleAction(payload);
      return res.status(200).send();
    }

    return res.status(200).send(); // Unknown type, but still acknowledge
  } catch (error) {
    console.error("❌ Error in /interactions route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

