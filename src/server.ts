import app from '~/app';
import config from '~/utils/config';

app.listen(config.server.port, config.server.host, () => {
    console.log(`⚡️ listening on ${config.server.host}:${config.server.port}`);
});
