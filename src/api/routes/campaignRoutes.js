const express = require('express');
const router = express.Router();
const campaignsController = require('../../../controllers/campaignsController');
const { authenticate } = require('../../../middleware/auth');

router.post('/', authenticate, campaignsController.createCampaign);
router.get('/', authenticate, campaignsController.getCampaigns);
router.get('/:id', authenticate, campaignsController.getCampaignById);
router.put('/:id/status', authenticate, campaignsController.updateCampaignStatus);
router.delete('/:id', authenticate, campaignsController.deleteCampaign);

module.exports = router;
