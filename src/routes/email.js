const express = require('express');
const router = express.Router();
const User = require('../models/User');
const emailService = require('../services/EmailService');
const { createEmailRateLimiter } = require('../middleware/rateLimiter');

const emailRateLimiter = createEmailRateLimiter();

router.post('/send-activation', emailRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[EmailRoute] POST /send-activation - email:', email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn('[EmailRoute] Invalid email:', email);
      return res.status(400).json({
        error: 'invalid_email',
        message: '邮箱格式不正确',
        statusCode: 400
      });
    }

    // 不区分用户是否存在，统一返回泛化响应以防止用户枚举
    const user = await User.findByEmail(email);
    console.log('[EmailRoute] send-activation user lookup - found:', !!user, 'email_verified:', user?.email_verified);

    if (user && !user.email_verified) {
      const activationCode = emailService.generateCode();
      console.log('[EmailRoute] Storing activation code...');
      await emailService.storeCode(email, activationCode, 'activation');
      const sendResult = await emailService.sendActivationEmail(email, activationCode);
      console.log('[EmailRoute] sendActivationEmail result:', JSON.stringify(sendResult));

      if (!sendResult.success) {
        console.error('[EmailRoute] Activation email send failed');
        return res.status(500).json({
          error: 'email_send_failed',
          message: '邮件发送失败，请稍后再试',
          statusCode: 500
        });
      }
    } else {
      console.log('[EmailRoute] User not found or already verified, skipping activation email');
    }

    res.json({
      message: '如果该邮箱已注册，激活邮件已发送',
      expires_in: 3600
    });
  } catch (err) {
    console.error('[EmailRoute] Send activation email error:', err.message, err.stack);
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
    console.log('[EmailRoute] POST /send-reset-password - email:', email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn('[EmailRoute] Invalid email:', email);
      return res.status(400).json({
        error: 'invalid_email',
        message: '邮箱格式不正确',
        statusCode: 400
      });
    }

    // 不区分用户是否存在，统一返回泛化响应以防止用户枚举
    const user = await User.findByEmail(email);
    console.log('[EmailRoute] send-reset-password user lookup - found:', !!user, 'hasPassword:', !!user?.password_hash);

    if (user && user.password_hash) {
      const resetCode = emailService.generateCode();
      console.log('[EmailRoute] Storing reset password code...');
      await emailService.storeCode(email, resetCode, 'reset_password');
      const sendResult = await emailService.sendResetPasswordEmail(email, resetCode);
      console.log('[EmailRoute] sendResetPasswordEmail result:', JSON.stringify(sendResult));

      if (!sendResult.success) {
        console.error('[EmailRoute] Reset password email send failed');
        return res.status(500).json({
          error: 'email_send_failed',
          message: '邮件发送失败，请稍后再试',
          statusCode: 500
        });
      }
    } else {
      console.log('[EmailRoute] User not found or no password set, skipping reset email');
    }

    res.json({
      message: '如果该邮箱已注册，密码重置邮件已发送',
      expires_in: 3600
    });
  } catch (err) {
    console.error('[EmailRoute] Send reset password email error:', err.message, err.stack);
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
    console.log('[EmailRoute] GET /verify-activation - email:', email, 'codePrefix:', code ? code.substring(0, 2) + '***' : 'empty');

    if (!code || !email) {
      console.warn('[EmailRoute] Missing code or email');
      return res.status(400).json({
        error: 'invalid_parameters',
        message: '缺少必要的参数',
        statusCode: 400
      });
    }

    const verification = await emailService.verifyCode(email, code, 'activation');
    console.log('[EmailRoute] Activation verification result:', verification.valid, 'reason:', verification.reason);

    if (!verification.valid) {
      return res.status(400).json({
        error: 'invalid_activation_code',
        message: verification.reason,
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    console.log('[EmailRoute] User lookup for activation - found:', !!user, 'email_verified:', user?.email_verified);

    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '用户不存在',
        statusCode: 404
      });
    }

    if (user.email_verified) {
      console.log('[EmailRoute] Account already activated');
      return res.json({
        message: '账号已激活，无需重复激活',
        redirect_uri: '/login'
      });
    }

    await User.update(user.id, { email_verified: true });
    console.log('[EmailRoute] Account activated successfully for user:', user.id);

    res.json({
      message: '账号已成功激活',
      redirect_uri: '/login'
    });
  } catch (err) {
    console.error('[EmailRoute] Verify activation error:', err.message, err.stack);
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
    console.log('[EmailRoute] POST /reset-password - email:', email, 'codePrefix:', reset_code ? reset_code.substring(0, 2) + '***' : 'empty');

    if (!email || !reset_code || !new_password || !confirm_password) {
      console.warn('[EmailRoute] Missing parameters');
      return res.status(400).json({
        error: 'invalid_parameters',
        message: '缺少必要的参数',
        statusCode: 400
      });
    }

    if (new_password.length < 8) {
      console.warn('[EmailRoute] Weak password');
      return res.status(400).json({
        error: 'weak_password',
        message: '密码至少8位',
        statusCode: 400
      });
    }

    if (new_password !== confirm_password) {
      console.warn('[EmailRoute] Password mismatch');
      return res.status(400).json({
        error: 'password_mismatch',
        message: '两次输入的密码不一致',
        statusCode: 400
      });
    }

    const verification = await emailService.verifyCode(email, reset_code, 'reset_password');
    console.log('[EmailRoute] Reset code verification result:', verification.valid, 'reason:', verification.reason);

    if (!verification.valid) {
      return res.status(400).json({
        error: 'invalid_reset_code',
        message: verification.reason,
        statusCode: 400
      });
    }

    const user = await User.findByEmail(email);
    console.log('[EmailRoute] User lookup for reset - found:', !!user);

    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: '用户不存在',
        statusCode: 404
      });
    }

    await User.changePassword(user.id, new_password);
    console.log('[EmailRoute] Password reset successful for user:', user.id);

    res.json({
      message: '密码已重置成功',
      redirect_uri: '/login'
    });
  } catch (err) {
    console.error('[EmailRoute] Reset password error:', err.message, err.stack);
    res.status(500).json({
      error: 'server_error',
      message: '密码重置失败',
      statusCode: 500
    });
  }
});

module.exports = router;