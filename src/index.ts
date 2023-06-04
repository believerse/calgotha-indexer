import { initialize as initializeConnection } from './connection';

const cert = process.env.TLS_CERT_PATH ?? '';
const key = process.env.TLS_KEY_PATH ?? '';

const port = process.env.PORT;

initializeConnection(port, cert, key);
