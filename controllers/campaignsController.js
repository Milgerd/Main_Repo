const Anthropic = require('@anthropic-ai/sdk');
const campaignsService = require('../services/campaignsService');

const client = new Anthropic();

async function createCampaign(req, res) {
  const { workspaceId, campaignType, description } = req.body;
  const userId = req.user.id;

  if (!workspaceId || !campaignType || !description) {
    return res.status(400).json({ error: 'workspaceId, campaignType, and description are required' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `Generate a ${campaignType} campaign for the following: ${description}` }]
    });
    const content = message.content[0].text;

    const campaign = await campaignsService.createCampaign({ workspaceId, campaignType, content, generatedByAi: true, userId });
    if (!campaign) {
      return res.status(403).json({ error: 'Workspace not found or access denied' });
    }
    return res.status(201).json(campaign);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
}

async function getCampaigns(req, res) {
  const userId = req.user.id;

  try {
    const campaigns = await campaignsService.getCampaignsByUser(userId);
    return res.status(200).json(campaigns);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

async function getCampaignById(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const campaign = await campaignsService.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.status(200).json(campaign);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign' });
  }
}

async function updateCampaignStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const campaign = await campaignsService.updateCampaignStatus(id, status, userId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or invalid status' });
    }
    return res.status(200).json(campaign);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update campaign status' });
  }
}

async function deleteCampaign(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const campaign = await campaignsService.deleteCampaign(id, userId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.status(200).json({ message: 'Campaign deleted', campaign });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
}

module.exports = { createCampaign, getCampaigns, getCampaignById, updateCampaignStatus, deleteCampaign };
