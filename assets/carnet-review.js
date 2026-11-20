export function carnetTripCounts(trip) {
  // Older Vue drafts used the visits field for either type of movement.
  if (trip.transits == null && trip.type === 'Transit') {
    return {visits: 0, transits: trip.visits ?? 0};
  }
  return {visits: trip.visits ?? 0, transits: trip.transits ?? 0};
}

export function renderCarnetReview(node, {record, signatory, edit, formatMoney, holderStep = 'holder'}) {
  const show = value => value === '' || value == null ? '—' : value;
  const field = (label, value, userText = false) => node('div', {},
    node('dt', {}, label), node('dd', {translate: userText ? 'no' : undefined}, show(value)));
  const section = (title, step, content) => node('section', {class: 'carnet-review-section'},
    node('div', {class: 'carnet-review-heading'},
      node('h3', {}, title),
      node('button', {type: 'button', class: 'text-button', 'aria-label': `Edit: ${title}`, onClick: () => edit(step)}, 'Edit')),
    content);
  const movements = (label, key) => {
    const countries = (record.trips || []).filter(trip => trip.country && Number(carnetTripCounts(trip)[key]) > 0);
    return node('div', {}, node('h4', {class: `carnet-movement-tag ${key}`}, label),
      countries.length ? node('ul', {}, ...countries.map(trip => node('li', {key: trip.id},
        node('span', {}, trip.country), node('span', {class: 'carnet-movement-count'}, String(carnetTripCounts(trip)[key])))))
        : node('p', {class: 'carnet-review-empty'}, 'None added'));
  };
  const items = record.items || [];
  const totals = items.reduce((result, item) => item.heading ? result : {
    pieces: result.pieces + (Number(item.pieces) || 0), value: result.value + (Number(item.value) || 0),
  }, {pieces: 0, value: 0});
  const goods = items.length ? node('table', {class: 'carnet-review-goods'},
    node('caption', {class: 'carnet-review-caption'}, 'ATA Carnet General List'),
    node('thead', {}, node('tr', {}, node('th', {scope: 'col'}, 'Description'),
      node('th', {scope: 'col'}, 'Pieces'), node('th', {scope: 'col'}, 'Value (GBP)'))),
    node('tbody', {}, ...items.map((item, index) => node('tr', {key: item.id || index},
      node('td', {translate: 'no'}, show(item.description)),
      node('td', {}, item.heading ? '—' : show(item.pieces)),
      node('td', {}, item.heading || item.value === '' || item.value == null ? '—' : formatMoney(item.value))))),
    node('tfoot', {}, node('tr', {}, node('th', {scope: 'row'}, 'Total'),
      node('td', {}, totals.pieces), node('td', {}, formatMoney(totals.value))))) : node('p', {}, 'No items added');
  const uses = Array.isArray(record.use) ? record.use : [record.use].filter(Boolean);

  return node('div', {class: 'carnet-review-summary'},
    section('Documents & setup', 'setup', node('dl', {class: 'carnet-review-values carnet-review-overview'},
      field('Your reference', record.yourReference || record.reference, true), field('Holder', record.exporter, true),
      field('Representative', record.representative, true), field('Signatory', signatory, true),
      field('Destination country', record.destination), field('Originals / copies', `${record.originals ?? 0} / ${record.copies ?? 0}`))),
    node('div', {class: 'carnet-review-itinerary'},
      section('Intended use of goods', 'intendedUse', node('dl', {class: 'carnet-review-values'},
        field('Intended use', uses.join(', ')),
        record.exhibition ? field('Exhibition', record.exhibition, true) : null,
        record.goodsType ? field('Goods type', record.goodsType, true) : null)),
      section('Destination and transit countries', 'countries', node('div', {},
        node('div', {class: 'carnet-review-movements'}, movements('Visit', 'visits'), movements('Transit', 'transits')),
        record.exits ? node('dl', {class: 'carnet-review-values'}, field('Exits from the UK', record.exits)) : null))),
    section('General List', 'goods', goods),
    section('Holder details', holderStep, node('dl', {class: 'carnet-review-values'},
      field('Holder', record.exporter, true), field('Address', record.exporterAddress, true))),
    section('Representative details', 'representative', node('dl', {class: 'carnet-review-values'},
      field('Representative', record.representative, true),
      record.representativeAddress ? field('Address', record.representativeAddress, true) : null)),
    section('Security details', 'security', node('dl', {class: 'carnet-review-values'},
      field('Security arrangement', record.security),
      record.securityReference ? field('Security reference', record.securityReference, true) : null,
      record.securityEvidence ? field('Security evidence', record.securityEvidence) : null,
      record.bank ? field('Bank / insurance company', record.bank, true) : null,
      field('Security details', record.securityDetails || record.securityNotes, true))));
}
