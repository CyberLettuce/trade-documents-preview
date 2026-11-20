const signatoryHelp = 'Choose the person authorised to make the exporter’s declaration on this application.';
const explanations = {
  'destination country': 'Choose the final destination for the goods. Enter transit countries separately where they are requested.',
  'your reference': 'Use a reference your team can recognise. The service assigns the application reference when you submit.',
  'signatory': signatoryHelp,
  'sample signatory': signatoryHelp,
  'certificate / carnet number': 'Use the number shown on the issued document. The application reference tracks the request.',
  'p.o. number': 'Use the purchase order number supplied by the exporter to match the application to their order.',
  'chamber reference': 'Enter the Chamber’s internal reference for this application.',
  'issue date': 'Choose the date the Chamber issues the certificate.',
  'stamp date': 'Choose the date the Chamber stamps the document.',
  'chamber signatory': 'Choose the Chamber officer who will sign the document.',
  'workflow step': 'Track the application’s internal progress. Use the decision buttons to approve or reject it.',
  'second reviewer': 'Choose a different active Chamber officer to perform the second check.',
  'goods type': 'Enter the overall category of goods. Use the General List for individual items.',
  'intended use of goods': 'Describe what the goods will be used for during the temporary visit.'
};

export function fieldHelp(label) {
  const key = typeof label === 'string' && label.trim().toLowerCase();
  return key && Object.hasOwn(explanations, key) ? explanations[key] : undefined;
}
