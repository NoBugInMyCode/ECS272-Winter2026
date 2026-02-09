let selectedCountry = null
const listeners = new Set()

export function setSelectedCountry(country) {
  selectedCountry = country
  listeners.forEach(fn => fn(selectedCountry))
}

export function onCountryChange(fn) {
  listeners.add(fn)
}
