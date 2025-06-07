// services/xummSdk.js
import 'dotenv/config';
import { XummSdk } from 'xumm-sdk';

const xumm = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);
export default xumm;
