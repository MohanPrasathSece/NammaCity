const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getMyBookmarks,
  addBookmark,
  removeBookmark,
} = require('../controllers/bookmarkController');

const router = express.Router();

router.use(protect);

router.get('/my', getMyBookmarks);
router.post('/:serviceId', addBookmark);
router.delete('/:serviceId', removeBookmark);

module.exports = router;
