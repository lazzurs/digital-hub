const express = require('express');
const addRequestId = require('express-request-id')();
const compression = require('compression');
const helmet = require('helmet');
const log = require('bunyan-request-logger')();
const nunjucks = require('nunjucks');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const config = require('../server/config');

const createIndexRouter = require('./routes/index');
const createHealthRouter = require('./routes/health');
const createContentRouter = require('./routes/content');
const createTagRouter = require('./routes/tags');

// const topicLinks = require('./data//topic-link.json');

const version = Date.now().toString();

module.exports = function createApp({
  appInfo,
  logger,
  hubFeaturedContentService,
  hubPromotedContentService,
  hubMenuService,
  hubContentService,
  hubTagsService,
  healthService,
}) {
  const app = express();

  // View Engine Configuration
  app.set('views', path.join(__dirname, '../server/views'));
  app.set('view engine', 'html');
  nunjucks.configure('server/views', {
    express: app,
    autoescape: true,
  });

  app.set('json spaces', 2);

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true);

  // Server Configuration
  app.set('port', process.env.PORT || 3000);

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  app.use(helmet());

  app.use(addRequestId);


  app.use(log.requestLogger());

  // Resource Delivery Configuration
  app.use(compression());

  // Cachebusting version string
  if (config.production) {
    // Version only changes on reboot
    app.locals.version = version;
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString();
      return next();
    });
  }

  if (config.production) {
    app.use('/public', sassMiddleware({
      src: path.join(__dirname, '../assets/sass'),
      dest: path.join(__dirname, '../assets/stylesheets'),
      debug: true,
      outputStyle: 'compressed',
      prefix: '/stylesheets/',
      includePaths: [
        'node_modules/govuk_frontend_toolkit/stylesheets',
        'node_modules/govuk_template_jinja/assets/stylesheets',
        'node_modules/govuk-elements-sass/public/sass',
        'node_modules/video.js/dist',
      ],
    }));
  }

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 };

  app.use(session({
    store: config.test ? null : new MemoryStore({
      checkPeriod: 300000, // prune expired entries every 5 minutes
    }),
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true,
  }));


  [
    '../public',
    '../assets',
    '../assets/stylesheets',
    '../node_modules/govuk_template_jinja/assets',
    '../node_modules/govuk_frontend_toolkit',
    '../node_modules/govuk-frontend/',
    '../node_modules/video.js/dist',
    '../node_modules/jplayer/dist',
    '../node_modules/jquery/dist',
    '../node_modules/mustache',
  ].forEach((dir) => {
    app.use('/public', express.static(path.join(__dirname, dir), cacheControl));
  });


  app.use('/assets', express.static(path.join(__dirname, '../node_modules/govuk-frontend/assets'), cacheControl));

  [
    '../node_modules/govuk_frontend_toolkit/images',
  ].forEach((dir) => {
    app.use('/public/images/icons', express.static(path.join(__dirname, dir), cacheControl));
  });

  // GovUK Template Configuration
  app.locals.asset_path = '/public/';
  app.locals.envVars = {
    MATOMO_URL: config.motamoUrl,
    APP_NAME: config.appName,
  };


  // Don't cache dynamic resources
  app.use(helmet.noCache());

  // Health end point
  app.use('/health', createHealthRouter({ appInfo, healthService }));

  // Navigation menu middleware
  app.use(async (req, res, next) => {
    if (req.session.mainMenu && req.session.topicsMenu) {
      res.locals.mainMenu = req.session.mainMenu;
      res.locals.topicsMenu = req.session.topicsMenu;

      return next();
    }
    try {
      const {
        mainMenu,
        topicsMenu,
      } = await hubMenuService.navigationMenu();

      req.session.mainMenu = mainMenu;
      res.locals.mainMenu = mainMenu;

      req.session.topicsMenu = topicsMenu;
      res.locals.topicsMenu = topicsMenu;

      return next();
    } catch (ex) {
      return next(ex);
    }
  });

  // Routing
  app.use('/', createIndexRouter({
    logger,
    hubFeaturedContentService,
    hubPromotedContentService,
  }));

  app.use('/content', createContentRouter({
    logger,
    hubContentService,
  }));

  app.use('/tags', createTagRouter({
    logger,
    hubTagsService,
  }));

  app.use('*', (req, res) => {
    res.status(404);
    res.render('pages/404');
  });

  app.use(renderErrors);

  // eslint-disable-next-line no-unused-vars
  function renderErrors(error, req, res, next) {
    logger.error(error, 'Unhandled error');

    res.status(error.status || 500);

    const locals = {
      message: 'Something went wrong.',
      req_id: req.id,
      stack: '',
    };
    if (error.expose || config.dev) {
      locals.message = error.message;
    }
    if (config.dev) {
      locals.stack = error.stack;
    }

    res.render('pages/error', locals);
  }

  return app;
};
