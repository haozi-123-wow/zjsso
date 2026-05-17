const express = require('express');
const provider = require('../services/oidc/Provider');

const router = express.Router();

router.get('/openid-configuration', (req, res) => {
  const discovery = provider.getDiscoveryDocument();
  res.json(discovery);
});

router.get('/jwks.json', (req, res) => {
  const jwks = provider.getJWKS();
  res.json(jwks);
});

module.exports = router;
