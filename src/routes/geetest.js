const express = require('express');
const router = express.Router();
const geetestService = require('../services/GeetestService');
const { createRateLimiter } = require('../middleware/rateLimiter');

const geetestLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  keyPrefix: 'geetest'
});

router.post('/register', geetestLimiter, (req, res) => {
  const captchaId = geetestService.getCaptchaId();

  if (!captchaId) {
    return res.json({
      captcha_id: '',
      success: 1,
      mock: true
    });
  }

  res.json({
    captcha_id: captchaId,
    success: 1
  });
});

router.post('/validate', geetestLimiter, async (req, res) => {
  const { lot_number = '', captcha_output = '', pass_token = '', gen_time = '' } = req.body;

  const result = await geetestService.validate({
    lot_number,
    captcha_output,
    pass_token,
    gen_time
  });

  if (result.result === 'success') {
    res.json({
      status: 'success',
      result: 'success',
      reason: result.reason || ''
    });
  } else {
    res.json({
      status: 'success',
      result: 'fail',
      reason: result.reason || 'validation failed'
    });
  }
});

module.exports = router;