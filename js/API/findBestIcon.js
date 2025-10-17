const searchAPIRawg = 'https://api.rawg.io/api'
const searchAPIClearbit = 'https://logo.clearbit.com'
const searchAPISteamGridDB = 'https://www.steamgriddb.com/api/v2'
const searchAPIGoogleFavicon = 'https://www.google.com/s2'

const guessDomainFromName = (name) => {
    if (!name) return null

    return name
      .toLowerCase()
      .replace(/_/g, '')
      .replace(/ /g, '')
      .replace('code', '')
      .replace('studio', '')
      + '.com'
}


/**
 * @param {string} name - O nome do programa ou jogo (ex: "Hollow Knight").
 * @param {object} apiKeys - Um objeto com as chaves de API fornecidas pelo usuário.
 * (ex: { steamGridDB: 'KEY', rawg: 'KEY' })
 * @returns {Promise<string|null>} A URL do ícone encontrado ou null se nada for encontrado.
 */
export async function getBestIcon(name, apiKeys = {}) {
  console.log(`Buscando ícone para: ${name}`)

  if (apiKeys) {
    if (apiKeys.steamGridDB) {
      const iconUrl = await searchSteamGridDB(name, apiKeys.steamGridDB)
      if (iconUrl) {
        return iconUrl;
      }
    }

    if (apiKeys.rawg) {
      const iconUrl = await searchRawg(name, apiKeys.rawg)
      if (iconUrl) {
        return iconUrl
      }
    }
  }


  const domain = guessDomainFromName(name)
  if (domain) {
    const iconUrlClearbit = await searchClearbit(domain)
    if (iconUrlClearbit) {
      return iconUrlClearbit
    }

    const iconUrlGF = await searchGoogleFavicon(domain);
    if (iconUrlGF) {
      return iconUrlGF
    }
  }

  return null
}


async function searchSteamGridDB(name, key) {
  try {
    const searchUrl = searchAPISteamGridDB + `/search/autocomplete/${encodeURIComponent(name)}`
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${key}` }
    })

    if (!searchResponse.ok) return null

    const searchData = await searchResponse.json()
    if (!searchData.success || searchData.data.length === 0) return null

    const gameId = searchData.data[0].id
    const iconsUrl = searchAPISteamGridDB + `/icons/game/${gameId}`

    const iconsResponse = await fetch(iconsUrl, {
      headers: { 'Authorization': `Bearer ${key}` }
    })

    if (!iconsResponse.ok) return null

    const iconsData = await iconsResponse.json()
    if (iconsData.success && iconsData.data.length > 0) {
      return iconsData.data[0].url
    }

    return null
  } catch (error) {
    console.error('SteamGridDB:', error)
    return null
  }
}

async function searchRawg(name, key) {
  try {
    const url = searchAPIRawg + `/games?key=${key}&search=${encodeURIComponent(name)}&page_size=1`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (data.results && data.results.length > 0 && data.results[0].background_image) {
      return data.results[0].background_image
    }

    return null
  } catch (error) {
    console.error('RAWG:', error);
    return null
  }
}

async function searchClearbit(domain) {
  try {
    const url = searchAPIClearbit + `/${domain}`;
    const response = await fetch(url);

    if (response.ok && response.status !== 202 && !response.url.includes('placeholder')) {
      return url;
    }

    return null;
  } catch (error) { return null }
}

async function searchGoogleFavicon(domain) {
  try {
    const url = searchAPIGoogleFavicon + `/favicons?domain=${domain}&sz=128`
    const response = await fetch(url)

    const blob = await response.blob()
    if (response.ok && blob.size > 100) return url

    return null
  } catch (error) { return null }
}
