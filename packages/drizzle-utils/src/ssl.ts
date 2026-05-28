import { createPrivateKey, createPublicKey, X509Certificate, type KeyObject } from 'node:crypto';

/**
 * Thrown when SSL certificate validation fails.
 * @public
 */
class SslValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'SslValidationError';
  }
}

function parseCaBundle(caPem: Buffer): X509Certificate[] {
  const pem = caPem.toString('utf8');
  const certBlocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
  if (certBlocks === null || certBlocks.length === 0) {
    throw new SslValidationError('CA contains no valid PEM certificates');
  }
  return certBlocks.map((block) => new X509Certificate(block));
}

function certMatchesKey(cert: X509Certificate, privateKey: KeyObject): boolean {
  const certPublicKeyDer = cert.publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const derivedPublicKeyDer = createPublicKey(privateKey).export({ type: 'spki', format: 'der' }) as Buffer;
  return certPublicKeyDer.equals(derivedPublicKeyDer);
}

/**
 * Validates a set of SSL/TLS credentials before they are used to establish a database connection.
 *
 * Checks performed:
 * 1. The client certificate PEM is a valid X.509 certificate.
 * 2. The private key PEM is a valid private key.
 * 3. The private key matches the public key embedded in the certificate.
 * 4. The certificate is signed by at least one CA in the CA bundle.
 *
 * @param key - PEM-encoded private key buffer.
 * @param cert - PEM-encoded client certificate buffer.
 * @param ca - PEM-encoded CA bundle buffer (may contain multiple certificates).
 * @throws {@link SslValidationError} When any validation step fails.
 * @public
 */
function validateSslCerts(key: Buffer, cert: Buffer, ca: Buffer): void {
  let clientCert: X509Certificate;
  try {
    clientCert = new X509Certificate(cert);
  } catch (err) {
    throw new SslValidationError(`Invalid client certificate: ${(err as Error).message}`);
  }

  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey(key);
  } catch (err) {
    throw new SslValidationError(`Invalid private key: ${(err as Error).message}`);
  }

  if (!certMatchesKey(clientCert, privateKey)) {
    throw new SslValidationError('Private key does not match the certificate public key');
  }

  let caCerts: X509Certificate[];
  try {
    caCerts = parseCaBundle(ca);
  } catch (err) {
    if (err instanceof SslValidationError) {
      throw err;
    }
    throw new SslValidationError(`Invalid CA bundle: ${(err as Error).message}`);
  }

  const isSignedByKnownCa = caCerts.some((caCert) => {
    try {
      return clientCert.verify(caCert.publicKey);
    } catch {
      return false;
    }
  });

  if (!isSignedByKnownCa) {
    throw new SslValidationError('Certificate is not signed by any certificate in the CA bundle');
  }
}

export { validateSslCerts, SslValidationError };
