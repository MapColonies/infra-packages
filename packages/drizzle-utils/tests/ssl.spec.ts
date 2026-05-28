import { describe, it, expect, beforeAll } from 'vitest';
import { generate, type GenerateResult } from 'selfsigned';
import { validateSslCerts, SslValidationError } from '../src/ssl';

const caOpts = { keySize: 2048, algorithm: 'sha256', extensions: [{ name: 'basicConstraints' as const, cA: true }] };

describe('#validateSslCerts', function () {
  let ca1: GenerateResult;
  let ca2: GenerateResult;
  let clientCert: GenerateResult;
  let unrelated: GenerateResult;

  beforeAll(async function () {
    ca1 = await generate(undefined, caOpts);
    ca2 = await generate(undefined, caOpts);
    clientCert = await generate(undefined, {
      keySize: 2048,
      algorithm: 'sha256',
      ca: { key: ca1.private, cert: ca1.cert },
    });
    unrelated = await generate(undefined, { keySize: 2048, algorithm: 'sha256' });
  });

  it('should pass for a valid cert, key, and single CA', function () {
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from(clientCert.cert), Buffer.from(ca1.cert))).not.toThrow();
  });

  it('should pass when the signing CA appears first in the bundle', function () {
    const bundle = Buffer.from(`${ca1.cert}\n${ca2.cert}`);
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from(clientCert.cert), bundle)).not.toThrow();
  });

  it('should pass when the signing CA appears after unrelated CAs in the bundle', function () {
    const bundle = Buffer.from(`${ca2.cert}\n${ca1.cert}`);
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from(clientCert.cert), bundle)).not.toThrow();
  });

  it('should throw SslValidationError when the private key does not match the certificate', function () {
    expect(() => validateSslCerts(Buffer.from(unrelated.private), Buffer.from(clientCert.cert), Buffer.from(ca1.cert))).toThrow(SslValidationError);
  });

  it('should throw SslValidationError when the CA bundle does not contain the signing CA', function () {
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from(clientCert.cert), Buffer.from(ca2.cert))).toThrow(SslValidationError);
  });

  it('should throw SslValidationError when the certificate PEM is invalid', function () {
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from('not-a-cert'), Buffer.from(ca1.cert))).toThrow(SslValidationError);
  });

  it('should throw SslValidationError when the private key PEM is invalid', function () {
    expect(() => validateSslCerts(Buffer.from('not-a-key'), Buffer.from(clientCert.cert), Buffer.from(ca1.cert))).toThrow(SslValidationError);
  });

  it('should throw SslValidationError when the CA bundle PEM is invalid', function () {
    expect(() => validateSslCerts(Buffer.from(clientCert.private), Buffer.from(clientCert.cert), Buffer.from('not-a-cert'))).toThrow(
      SslValidationError
    );
  });
});
