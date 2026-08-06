export function healthCheckHandler() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'trust-fall-backend',
  };
}
