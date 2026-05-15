const express = require('express');
const router = express.Router();
const campaignsController = require('../../../controllers/campaignsController');
const { authenticate, requireRole } = require('../../../middleware/auth');

router.post('/', authenticate, requireRole(['admin', 'user']), campaignsController.createCampaign);
router.get('/', authenticate, requireRole(['admin', 'user', 'viewer']), campaignsController.getCampaigns);
router.get('/:id', authenticate, requireRole(['admin', 'user', 'viewer']), campaignsController.getCampaignById);
router.put('/:id/status', authenticate, requireRole(['admin', 'user']), campaignsController.updateCampaignStatus);
router.delete('/:id', authenticate, requireRole(['admin', 'user']), campaignsController.deleteCampaign);

module.exports = router;
