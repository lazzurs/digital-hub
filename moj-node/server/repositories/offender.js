const config = require('../config');

function offenderRepository(httpClient) {
  function getOffenderDetailsFor(offenderNo) {
    return httpClient.get(
      `${config.nomis.api.bookings}/offenderNo/${offenderNo}`,
    );
  }

  function getIEPSummaryFor(bookingId) {
    return httpClient.get(
      `${config.nomis.api.bookings}/${bookingId}/iepSummary`,
    );
  }

  function getBalancesFor(bookingId) {
    return httpClient.get(`${config.nomis.api.bookings}/${bookingId}/balances`);
  }

  function getKeyWorkerFor(offenderNo) {
    return httpClient.get(
      `${config.nomis.api.bookings}/offenderNo/${offenderNo}/key-worker`,
    );
  }

  function getNextVisitFor(bookingId) {
    return httpClient.get(
      `${config.nomis.api.bookings}/${bookingId}/visits/next`,
    );
  }

  function getLastVisitFor(bookingId) {
    return httpClient.get(
      `${config.nomis.api.bookings}/${bookingId}/visits/last`,
    );
  }

  function sentenceDetailsFor(bookingId) {
    return httpClient.get(
      `${config.nomis.api.bookings}/${bookingId}/sentenceDetail`,
    );
  }

  function getEventsForToday(bookingId) {
    return httpClient.get(
      `${config.nomis.api.bookings}/${bookingId}/events/today`,
    );
  }

  function getEventsFor(bookingId, startDate, endDate) {
    const endpoint = `${config.nomis.api.bookings}/${bookingId}/events`;
<<<<<<< HEAD
    const query = [
      `fromDate=${startDate}`,
      `toDate=${endDate}`,
      `Sort-Fields=eventDate,startTime`,
    ];

    return httpClient.get(`${endpoint}?${query.join('&')}`);
=======
    const query = {
      fromDate: startDate,
      toDate: endDate,
      'Page-Limit': 0,
      'Sort-Fields': 'eventDate,startTime',
    };

    return httpClient.get(endpoint, { query });
>>>>>>> Add endpoint call for all events
  }

  return {
    getOffenderDetailsFor,
    getIEPSummaryFor,
    getBalancesFor,
    getKeyWorkerFor,
    getNextVisitFor,
    getLastVisitFor,
    sentenceDetailsFor,
    getEventsForToday,
    getEventsFor,
  };
}

module.exports = offenderRepository;
