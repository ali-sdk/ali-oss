const Sentry = require('@sentry/node');

// dsn example: http://dc73399c8c684c8296c2f956e7ba9048:947b03c67af14d4f824f3a7ed6eb398b@localhost:9000/4
Sentry.init({
    release: "sentry-ali-oss@1.0.4",
    dsn: 'https://b84b74ccad2f440b98793aea9f126b02@sentry.io/1399991',
});

Sentry.captureException(new Error('fuck-4445dddddddddddddddddd'));

console.log('fix bug')
