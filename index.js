const path = require('path')
const arvish = require('arvish')
const torrentSearch = require('torrent-search-api')
const { format, formatDistance, isBefore } = require('date-fns')
const chrono = require('chrono-node')
const R = require('ramda')

arvish.cache.clear()
const ENABLED_PROVIDERS = {}
torrentSearch.enableProvider('thepiratebay')
torrentSearch.enableProvider('Rarbg')

const sortBySeedsAndPeers = R.sortWith([R.descend(R.prop('seeds')), R.descend(R.prop('peers'))])

const parseUploadDate = date =>
	date && isBefore(chrono.parseDate(date), Date.now())
		? formatDistance(chrono.parseDate(date), Date.now(), { addSuffix: true })
		: date

const formatSubtitle = ({ provider, size, time, seeds, peers }) =>
	`[${provider}] ${size} | ⏳: ${parseUploadDate(time)} | ⏫: ${seeds} | ⏬: ${peers}`

const formatTitle = ({ title }) => title

const formatIcon = ({ provider }) => ({
	path: `./media/${provider.toLowerCase()}-icon.png`,
})

const getMagnetLink = torrent => torrent.magnet || torrent.link || torrent.id

const memoizedSearch = searchFn => async query => {
	const memoizeAndReturn = results => arvish.cache.set(query, results) || results
	return arvish.cache.get(query) || memoizeAndReturn(await searchFn(query))
}

const showResults = results => arvish.output(results)

const searchTorrents = memoizedSearch(async query =>
	torrentSearch.search(query, 'All', 50).then(results =>
		sortBySeedsAndPeers(results).map(torrent => ({
			title: formatTitle(torrent),
			subtitle: formatSubtitle(torrent),
			icon: formatIcon(torrent),
			arg: getMagnetLink(torrent),
		}))
	)
)

searchTorrents(arvish.input).then(showResults)
