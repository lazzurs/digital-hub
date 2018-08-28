const R = require('ramda');
const { parseHubContentResponse } = require('../utils/index');
const config = require('../config');

function hubPromotedContentRepository(httpClient) {
  async function hubPromotedContent(opts = { query: {} }) {
    const response = await httpClient.get(`${config.api.hubContent}/promoted`, opts.query);
    if (R.prop('message', response) || response === null) return [];

    return parseHubContentResponse(response);
  }

  return {
    hubPromotedContent,
  };
}

module.exports = hubPromotedContentRepository;
