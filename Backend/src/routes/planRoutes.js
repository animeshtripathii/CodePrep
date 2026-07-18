const express = require('express');
const { getAllPlans } = require('../controllers/planController');

const router = express.Router();

router.get('/all', getAllPlans);

module.exports = router;
