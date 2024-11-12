import Expire, { ExpireOptions } from '@krakaw/expire';

import logger from './logger';

class NoDataAlert {
    expires: Expire[] = [];

    addAlert(
        { expireInterval, backoff }: ExpireOptions,
        webhookUrl: string | URL,
        message: string
    ): Expire {
        const expire = new Expire({
            expireInterval,
            backoff,
            onExpire: (lastHeartbeat) => {
                if (!webhookUrl) {
                    logger.error(
                        'No webhook url provided for no data alert, logging instead.'
                    );
                    logger.warn(message);
                    return;
                }
                void fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: `${message}${
                            lastHeartbeat
                                ? `\nLast heartbeat: ${lastHeartbeat.toISOString()}`
                                : ''
                        }`
                    })
                });
            }
        });
        this.expires.push(expire);
        return expire;
    }
}

export default new NoDataAlert();
