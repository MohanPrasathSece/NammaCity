const express = require('express');
const {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
} = require('../controllers/issueController');

const Issue = require('../models/Issue');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(Issue, 'reportedBy'), getIssues)
  .post(protect, createIssue);

router
  .route('/:id')
  .get(getIssue)
  .put(protect, updateIssue)
  .delete(protect, deleteIssue);

module.exports = router;
