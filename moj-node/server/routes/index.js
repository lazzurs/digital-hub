const express = require('express');
const { path } = require('ramda');
const { authenticate } = require('ldap-authentication');
const {
  FACILITY_LIST_CONTENT_IDS: facilitiesList,
} = require('../constants/hub');

const getFacilitiesListFor = id =>
  Object.prototype.hasOwnProperty.call(facilitiesList, id)
    ? facilitiesList[id]
    : '/404';

module.exports = function Index({ logger, hubFeaturedContentService }) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      logger.info('GET index');

      const notification = path(['session', 'notification'], req);
      const userName = path(['session', 'user', 'name'], req);
      const establishmentId = path(['locals', 'establishmentId'], res);
      const newDesigns = path(['locals', 'features', 'newDesigns'], res);

      const featuredContent = await hubFeaturedContentService.hubFeaturedContent(
        { establishmentId },
      );

      const options = {
        ldapOpts: {
          url: path(['locals', 'ldap', 'url'], res),
          // tlsOptions: { rejectUnauthorized: false }
        },
        adminDn: path(['locals', 'ldap', 'adminDn'], res),
        adminPassword: path(['locals', 'ldap', 'adminPassword'], res),
        userPassword: path(['query', 'pwd'], req),
        userSearchBase: path(['locals', 'ldap', 'userSearchBase'], res),
        usernameAttribute: 'uid',
        username: path(['query', 'uid'], req),
        // starttls: false
      };

      let ldap;

      try {
        ldap = await authenticate(options);
      } catch (e) {
        ldap = e.message;
      }

      const config = {
        content: true,
        header: true,
        postscript: true,
        detailsType: 'large',
        newDesigns,
        userName,
        establishmentId,
      };

      const popularTopics = {
        Visits: '/content/4203',
        Incentives: '/content/4204',
        Games: '/content/3621',
        Inspiration: '/content/3659',
        'Music & talk': '/content/3662',
        'PSIs & PSOs': '/tags/796',
        'Facilities list & catalogues': getFacilitiesListFor(establishmentId),
        'Healthy mind & body': '/content/3657',
        'Money & debt': '/content/4201',
      };

      res.render('pages/home', {
        notification,
        config,
        popularTopics,
        featuredContent: featuredContent.featured[0],
        ldap: JSON.stringify(ldap),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
