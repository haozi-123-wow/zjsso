const express = require('express');
const router = express.Router();
const User = require('../models/User');
const emailService = require('../services/EmailService');
const { createEmailRateLimiter } = require('../middleware/rateLimiter');

const emailRateLimiter = createEmailRateLimiter();

router.post('/send-activation', emailRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'invalid_email',
        message: '邮箱格式不正确',
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '该邮箱未注册',
        statusCode: 404
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        error: 'already_activated',
        message: '该账号已经激活，无需重复激活',
        statusCode: 400
      });
    }

    const activationCode = emailService.generateCode();
    await emailService.storeCode(email, activationCode, 'activation');
    const sendResult = await emailService.sendActivationEmail(email, activationCode);

    if (sendResult.success) {
      res.json({
        message: '激活邮件已发送',
        expires_in: 3600
      });
    } else {
      res.status(500).json({
        error: 'email_send_failed',
        message: '邮件发送失败，请稍后再试',
        statusCode: 500
      });
    }
  } catch (err) {
    console.error('Send activation email error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '邮件发送失败',
      statusCode: 500
    });
  }
});

router.post('/send-reset-password', emailRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'invalid_email',
        message: '邮箱格式不正确',
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '该邮箱未注册',
        statusCode: 404
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        error: 'no_password',
        message: '该账号为第三方登录账号，未设置密码',
        statusCode: 400
      });
    }

    const resetCode = emailService.generateCode();
    await emailService.storeCode(email, resetCode, 'reset_password');
    const sendResult = await emailService.sendResetPasswordEmail(email, resetCode);

    if (sendResult.success) {
      res.json({
        message: '密码重置邮件已发送',
        expires_in: 3600
      });
    } else {
      res.status(500).json({
        error: 'email_send_failed',
        message: '邮件发送失败，请稍后再试',
        statusCode: 500
      });
    }
  } catch (err) {
    console.error('Send reset password email error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '邮件发送失败',
      statusCode: 500
    });
  }
});

router.get('/verify-activation', async (req, res) => {
  try {
    const { code, email } = req.query;

    if (!code || !email) {
      return res.status(400).json({
        error: 'invalid_parameters',
        message: '缺少必要的参数',
        statusCode: 400
      });
    }

    const verification = await emailService.verifyCode(email, code, 'activation');
    if (!verification.valid) {
      return res.status(400).json({
        error: 'invalid_activation_code',
        message: verification.reason,
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '用户不存在',
        statusCode: 404
      });
    }

    if (user.email_verified) {
      return res.json({
        message: '账号已激活，无需重复激活',
        redirect_uri: '/login'
      });
    }

    await User.update(user.id, { email_verified: true });

    res.json({
      message: '账号已成功激活',
      redirect_uri: '/login'
    });
  } catch (err) {
    console.error('Verify activation error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '激活失败',
      statusCode: 500
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, reset_code, new_password, confirm_password } = req.body;

    if (!email || !reset_code || !new_password || !confirm_password) {
      return res.status(400).json({
        error: 'invalid_parameters',
        message: '缺少必要的参数',
        statusCode: 400
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'weak_password',
        message: '密码至少8位',
        statusCode: 400
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        error: 'password_mismatch',
        message: '两次输入的密码不一致',
        statusCode: 400
      });
    }

    const verification = await emailService.verifyCode(email, reset_code, 'reset_password');
    if (!verification.valid) {
      return res.status(400).json({
        error: 'invalid_reset_code',
        message: verification.reason,
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '用户不存在',
        statusCode: 404
      });
    }

    await User.changePassword(user.id, new_password);

    res.json({
      message: '密码已重置成功',
      redirect_uri: '/login'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '密码重置失败',
      statusCode: 500
    });
  }
});

module.exports = router;