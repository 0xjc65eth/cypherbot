const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/connect-wallet', userController.connectWallet);
router.get('/:id/portfolio', userController.getPortfolio);

module.exports = router;
