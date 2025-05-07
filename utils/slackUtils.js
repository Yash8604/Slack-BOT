const axios = require('axios');
require('dotenv').config();

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

// Fetch all members from Slack to populate dropdown
const getSlackUsers = async () => {
  const res = await axios.get('https://slack.com/api/users.list', {
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`
    }
  });

  // Filter out bots and Slackbot
  return res.data.members
    .filter(member => !member.is_bot && member.id !== 'USLACKBOT')
    .map(member => ({
      id: member.id,
      name: member.real_name || member.name
    }));
};

// Show modal to requester when slash command is used
const openApprovalModal = async (trigger_id) => {
  const users = await getSlackUsers();

  const modalView = {
    type: 'modal',
    callback_id: 'submit_approval',
    title: { type: 'plain_text', text: 'Request Approval' },
    submit: { type: 'plain_text', text: 'Submit' },
    blocks: [
      {
        type: 'input',
        block_id: 'approver_select',
        element: {
          type: 'static_select',
          action_id: 'approver',
          placeholder: { type: 'plain_text', text: 'Select Approver' },
          options: users.map(user => ({
            text: { type: 'plain_text', text: user.name },
            value: user.id
          }))
        },
        label: { type: 'plain_text', text: 'Approver' }
      },
      {
        type: 'input',
        block_id: 'approval_text',
        element: {
          type: 'plain_text_input',
          multiline: true,
          action_id: 'text'
        },
        label: { type: 'plain_text', text: 'Approval Message' }
      }
    ]
  };

  await axios.post('https://slack.com/api/views.open', {
    trigger_id,
    view: modalView
  }, {
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

// Once requester submits modal, send message to approver
const handleModalSubmission = async (payload) => {
  const values = payload.view.state.values;
  const approverId = values.approver_select.approver.selected_option.value;
  const message = values.approval_text.text.value;
  const requesterId = payload.user.id;

  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: approverId,
    text: `New approval request from <@${requesterId}>`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Request from <@${requesterId}>:*\n>${message}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve' },
            style: 'primary',
            action_id: 'approve',
            value: JSON.stringify({ requesterId })
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject' },
            style: 'danger',
            action_id: 'reject',
            value: JSON.stringify({ requesterId })
          }
        ]
      }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

// When approver clicks Approve/Reject
const handleAction = async (payload) => {
  const action = payload.actions[0];
  const { requesterId } = JSON.parse(action.value);

  const status = action.action_id === 'approve' ? '✅ Approved' : '❌ Rejected';

  // Send message back to requester
  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: requesterId,
    text: `Your request was *${status}* by <@${payload.user.id}>.`
  }, {
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

module.exports = {
  openApprovalModal,
  handleModalSubmission,
  handleAction
};
