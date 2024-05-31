import bcrypt from 'bcryptjs';
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import Login from '../../../db/models/login';
import User from '../../../db/models/user';
import { JwtScope } from '../../../types/jwt';
import { Providers } from '../../../types/login';
import { Services } from '../../../types/services';
import { UserRoles } from '../../../types/user';
import { authenticateJwtUser, generateJwtTokens } from '../../auth/jwt';

export default (services: Services): Router => {
    const router = express.Router();
    const { dataSource } = services;

    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, cb) => {
            (async (): Promise<void> => {
                const loginRepository = dataSource.getRepository(Login);
                const login = await loginRepository.findOne({
                    where: {
                        provider: Providers.Local,
                        providerId: email
                    },
                    relations: {
                        user: true
                    }
                });
                if (!login || !login.metadata?.local?.password) {
                    cb(null, false, {
                        message: 'Incorrect username or password.'
                    });
                    return;
                }
                if (
                    !bcrypt.compareSync(password, login.metadata.local.password)
                ) {
                    cb(null, false, {
                        message: 'Incorrect username or password.'
                    });
                    return;
                }
                cb(null, login.user);
            })();
        })
    );

    router.post('/login', (req, res, next) => {
        passport.authenticate(
            'local',
            { session: false },
            (err, user, info) => {
                if (err || !user) {
                    res.status(400).json({
                        message: info ? info.message : 'Login failed'
                    });
                    return;
                }

                req.login(user, { session: false }, (err) => {
                    (async () => {
                        if (err) {
                            res.send(err);
                        }
                        // Get the login salt
                        const loginRepository = dataSource.getRepository(Login);
                        const login = await loginRepository.findOneOrFail({
                            where: {
                                provider: Providers.Local,
                                userId: user.id
                            }
                        });
                        const tokenData = {
                            id: user.id,
                            scope: JwtScope.Access,
                            role: user.role
                        };
                        // Generate a signed JWT with the contents of user object
                        const tokens = generateJwtTokens(
                            tokenData,
                            login.metadata?.local?.salt
                        );
                        return res.json(tokens);
                    })();
                });
            }
        )(req, res, next);
    });

    router.post('/register', async (req, res) => {
        const loginRepository = dataSource.getRepository(Login);
        const userRepository = dataSource.getRepository(User);
        const { email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        // Return duplicate status error if login already exists
        const existingLogin = await loginRepository.findOne({
            where: {
                provider: Providers.Local,
                providerId: email
            }
        });
        if (existingLogin) {
            res.status(201).json({
                message: 'Please login'
            });
            return;
        }
        const user = await userRepository.save({
            role: UserRoles.User
        });
        await loginRepository.save({
            provider: Providers.Local,
            providerId: email,
            metadata: {
                local: {
                    password: hash,
                    salt
                }
            },
            user
        });
        res.status(201).json({
            message: 'Please login'
        });
    });

    router.post('/refresh', async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh Token is required' });
            return;
        }

        try {
            // First extract user id from the token to get the salt from the DB
            const decoded = jwt.decode(refreshToken);
            // Fetch the user
            const userRepository = dataSource.getRepository(User);
            const user = await userRepository
                .createQueryBuilder()
                .where({
                    id: decoded.id
                })
                .leftJoinAndSelect(
                    'User.logins',
                    'logins',
                    'provider = :provider',
                    { provider: Providers.Local }
                )
                .getOne();

            if (!user) {
                res.status(403).json({ message: 'Invalid Refresh Token' });
                return;
            }
            // Verify the refresh token
            authenticateJwtUser(
                JwtScope.Refresh,
                refreshToken,
                user.logins[0].metadata?.local?.salt
            );
            // If validation passes, generate a new JWT and a new refresh token
            const tokenData = {
                id: user.id,
                scope: JwtScope.Access,
                role: user.role
            };
            // Generate a signed JWT with the contents of user object
            const tokens = generateJwtTokens(
                tokenData,
                user.logins[0].metadata?.local?.salt
            );

            res.json(tokens);
        } catch (error) {
            res.status(403).json({ message: 'Invalid Refresh Token' });
        }
    });

    return router;
};
