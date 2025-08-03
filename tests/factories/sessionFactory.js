const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');

const keyGrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
    const sessionObject = {
        passport: {
            user: user._id.toString(),
        },
    };

    const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
    const sig = keyGrip.sign('session=' + session);

    return { session, sig };
}