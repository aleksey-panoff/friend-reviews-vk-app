const pluralForm = (forms, n) => {
  if (n % 10 === 1 && n % 100 !== 11) return forms[0]
  return forms[n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
}

export default pluralForm
