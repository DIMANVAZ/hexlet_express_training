// @ts-check

import Express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

import encrypt from './encrypt.js';
import User from './entities/User.js';
import Guest from './entities/Guest.js';

export default () => {
    const app = new Express();
    app.use(morgan('combined'));
    app.use(methodOverride('_method'));
    app.set('view engine', 'pug');
    app.use(bodyParser.urlencoded({ extended: false }));
    //app.use('/assets', Express.static(process.env.NODE_PATH.split(':')[0]));
    app.use('/assets', Express.static('./node_modules'));
    app.use(session({
        secret: 'secret key',
        resave: false,
        saveUninitialized: false,
    }));

    const users = [new User('admin', encrypt('qwerty'))];

    app.use((req, res, next) => {
        if (req.session?.nickname) {
            const { nickname } = req.session;
            res.locals.currentUser = users.find((user) => user.nickname === nickname);
        } else {
            res.locals.currentUser = new Guest();
        }
        next();
    });

    app.get('/', (_req, res) => {
        res.render('index');
    });

    // BEGIN --------------(write your solution here)
    app.get('/users/new', (_req, res) => {
        res.render('users/new', { form: {}, errors: {} });
    });

    app.post('/users', (req, res) => {
        const { nickname, password } = req.body;

        const errors = {};
        if (!nickname) {
            errors.nickname = "Can't be blank";
        } else {
            const isUniq = !users.some((user) => user.nickname === nickname);
            if (!isUniq) {
                errors.nickname = 'Already exist';
            }
        }

        if (!password) {
            errors.password = "Can't be blank";
        }

        if (Object.keys(errors).length > 0) {
            res.status(422);
            res.render('users/new', { form: req.body, errors });
            return;
        }

        const user = new User(nickname, encrypt(password));
        users.push(user);
        res.redirect('/');
    });

    app.get('/session/new', (_req, res) => {
        res.render('session/new', { form: {} });
    });

    app.post('/session', (req, res) => {
        const { nickname, password } = req.body;
        const user = users.find((u) => u.nickname === nickname);
        if (!user || (user.passwordDigest !== encrypt(password))) {
            res.status(422);
            res.render('session/new', { form: req.body, error: 'Invalid nickname or password' });
            return;
        }

        req.session.nickname = user.nickname;
        res.redirect('/');
    });

    app.delete('/session', (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });

    // ------------------------- END

    return app;
};
