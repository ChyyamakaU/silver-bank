'use strict';

const express = require('express');
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateProfileSchema, changePasswordSchema, changePinSchema } = require('../validators/profile');

const router = express.Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/', validate(updateProfileSchema), profileController.updateProfile);
router.patch('/password', validate(changePasswordSchema), profileController.changePassword);
router.patch('/pin', validate(changePinSchema), profileController.changePin);

module.exports = router;