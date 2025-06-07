// routes/xumm.js
import express from 'express';
import xumm from '../services/xummSdk.js';

const router = express.Router();

let payloadStore = {};

router.get('/login', async (req, res) => {
  try {
    const payload = await xumm.payload.create({
      txjson: { TransactionType: 'SignIn' }
    });

    payloadStore[payload.uuid] = payload;
    res.json({ qr: payload.refs.qr_png, uuid: payload.uuid });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to create sign-in request' });
  }
});

router.get('/check/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await xumm.payload.get(uuid);

    if (result.meta.signed) {
      res.json({ signed: true, address: result.response.account });
    } else {
      res.json({ signed: false });
    }
  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({ error: 'Failed to check sign-in status' });
  }
});

export default router;
