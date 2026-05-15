const pool = require('../db');
const { createNotification } = require('../src/api/services/notificationService.js');

async function createCampaign({ workspaceId, campaignType, content, generatedByAi, userId }) {
  const { rows } = await pool.query(
    `INSERT INTO campaigns (workspace_id, campaign_type, content, generated_by_ai)
     SELECT $1, $2, $3, $4
     FROM workspaces
     WHERE id = $1 AND owner_id = $5
     RETURNING *`,
    [workspaceId, campaignType, content, generatedByAi, userId]
  );
  const campaign = rows[0];
  await createNotification(userId, 'campaign', `New campaign generated: ${campaign.campaign_type}`);
  return campaign;
}

async function getCampaignsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.workspace_id, c.project_id, c.campaign_type, c.content, c.status, c.generated_by_ai, c.created_at,
            w.startup_name
     FROM campaigns c
     JOIN workspaces w ON w.id = c.workspace_id
     WHERE w.owner_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getCampaignById(campaignId, userId) {
  const { rows } = await pool.query(
    `SELECT c.*, w.startup_name
     FROM campaigns c
     JOIN workspaces w ON w.id = c.workspace_id
     WHERE c.id = $1 AND w.owner_id = $2`,
    [campaignId, userId]
  );
  return rows[0];
}

async function updateCampaignStatus(campaignId, status, userId) {
  const { rows } = await pool.query(
    `UPDATE campaigns
     SET status = $2
     FROM workspaces w
     WHERE campaigns.workspace_id = w.id
       AND campaigns.id = $1
       AND w.owner_id = $3
       AND $2 IN ('draft', 'active', 'complete')
     RETURNING campaigns.*`,
    [campaignId, status, userId]
  );
  return rows[0];
}

async function deleteCampaign(campaignId, userId) {
  const { rows } = await pool.query(
    `DELETE FROM campaigns
     USING workspaces w
     WHERE campaigns.workspace_id = w.id
       AND campaigns.id = $1
       AND w.owner_id = $2
     RETURNING campaigns.*`,
    [campaignId, userId]
  );
  return rows[0];
}

module.exports = { createCampaign, getCampaignsByUser, getCampaignById, updateCampaignStatus, deleteCampaign };
