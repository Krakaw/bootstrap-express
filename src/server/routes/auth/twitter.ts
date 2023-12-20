import express, { Router } from 'express';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';

import Login from '../../../db/models/login';
import User from '../../../db/models/user';
import { JwtScope } from '../../../types/jwt';
import { Providers } from '../../../types/login';
import { Services } from '../../../types/services';
import { UserRoles } from '../../../types/user';
import config from '../../../utils/config';
import { generateJwtTokens } from '../../auth/jwt';

export default (services: Services): Router => {
    const router = express.Router();

    passport.use(
        new TwitterStrategy(
            {
                clientType: 'confidential',
                consumerKey: config.auth.twitter.consumerKey,
                consumerSecret: config.auth.twitter.consumerSecret,
                callbackURL: config.auth.twitter.callbackURL
            },
            (token, tokenSecret, profile, cb) => {
                (async () => {
                    const loginRepository =
                        services.dataSource.getRepository(Login);
                    const userRepository =
                        services.dataSource.getRepository(User);
                    try {
                        const existingLogin = await loginRepository.findOne({
                            where: {
                                provider: Providers.Twitter,
                                providerId: profile.id
                            },
                            relations: {
                                user: true
                            }
                        });
                        if (!existingLogin) {
                            const user = await userRepository.save({
                                role: UserRoles.User
                            });
                            await loginRepository.save({
                                provider: Providers.Twitter,
                                providerId: profile.id,
                                metadata: {
                                    twitter: {
                                        token,
                                        tokenSecret,
                                        profile
                                    }
                                },
                                user
                            });
                            return cb(null, user);
                        }

                        return cb(null, existingLogin.user);
                    } catch (err) {
                        return cb(err, null);
                    }
                })();
            }
        )
    );
    router.get('', passport.authenticate('twitter', { session: false }));

    router.get(
        '/callback',
        passport.authenticate('twitter', {
            failureRedirect: config.auth.twitter.failureURL
        }),
        (req, res) => {
            // Successful authentication, redirect home.
            // Set a cookie with the JWT tokens
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const { user } = req;
            const { token, refreshToken } = generateJwtTokens({
                id: user.id,
                role: user.role,
                scope: JwtScope.Access
            });
            res.cookie('token', token, {
                httpOnly: true,
                secure: config.app.environment === 'production'
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: config.app.environment === 'production'
            });
            res.redirect(config.auth.twitter.successURL);
        }
    );
    //
    return router;
};
