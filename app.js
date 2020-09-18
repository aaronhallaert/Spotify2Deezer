///
/// This script parses a Spotify Url and searches Deezer for the corresponding track(s)
/// Works with single track, playlist and album
/// All deezer url's for the deezer tracks are gathered in a downloadLinks.txt file
///
var request = require('request')
var http = require('https')
const fs = require('fs')
const fuzzy = require('fuzzyset.js')
const prompts = require('prompts')

var spotify_client_id = '' // Your client id
var spotify_client_secret = '' // Your secret
var token = ''

function getPlaylist(id, token) {
    return new Promise(function (resolve, reject) {
        var options = {
            method: 'GET',
            hostname: 'api.spotify.com',
            path: '/v1/playlists/' + id,
            headers: {
                Authorization: 'Bearer ' + token,
                'User-Agent': 'PostmanRuntime/7.11.0',
                Accept: '*/*',
                'Cache-Control': 'no-cache',
                'Postman-Token':
                    '1bfda26b-dd8e-457b-b787-f4b5b9702287,8b1fb686-5bc2-4cc6-ba54-4fe75a9330b4',
                Host: 'api.spotify.com',
                'accept-encoding': 'json',
                Connection: 'keep-alive',
                'cache-control': 'no-cache',
            },
        }

        var req = http.request(options, function (res) {
            var chunks = []

            res.on('data', function (chunk) {
                chunks.push(chunk)
            })

            res.on('end', function () {
                var all_tracks = []
                var body = Buffer.concat(chunks)
                var json = JSON.parse(body)

                console.log(json.name)
                var items = json.tracks.items
                for (i = 0; i < items.length; i++) {
                    var json_track = items[i].track
                    var track = {
                        artist: json_track.artists[0].name,
                        name: json_track.name,
                        album: json_track.album.name,
                    }
                    all_tracks.push(track)
                }
                resolve(all_tracks)
            })
            req.on('error', function (err) {
                // This is not a "Second reject", just a different sort of failure
                reject(err)
            })
        })

        req.end()
    })
}

function getAlbum(id, token) {
    return new Promise(function (resolve, reject) {
        var options = {
            method: 'GET',
            hostname: 'api.spotify.com',
            path: '/v1/albums/' + id,
            headers: {
                Authorization: 'Bearer ' + token,
                'User-Agent': 'PostmanRuntime/7.11.0',
                Accept: '*/*',
                'Cache-Control': 'no-cache',
                'Postman-Token':
                    '1bfda26b-dd8e-457b-b787-f4b5b9702287,8b1fb686-5bc2-4cc6-ba54-4fe75a9330b4',
                Host: 'api.spotify.com',
                'accept-encoding': 'json',
                Connection: 'keep-alive',
                'cache-control': 'no-cache',
            },
        }

        var req = http.request(options, function (res) {
            var chunks = []

            res.on('data', function (chunk) {
                chunks.push(chunk)
            })

            res.on('end', function () {
                var all_tracks = []
                var body = Buffer.concat(chunks)
                var json = JSON.parse(body)
                var items = json.tracks.items
                var albumName = json.name
                for (i = 0; i < items.length; i++) {
                    var json_track = items[i]
                    var track = {
                        artist: json_track.artists[0].name,
                        name: json_track.name,
                        album: albumName,
                    }
                    all_tracks.push(track)
                }

                resolve(all_tracks)
            })

            req.on('error', function (err) {
                // This is not a "Second reject", just a different sort of failure
                reject(err)
            })
        })

        req.end()
    })
}

function getTrack(id, token) {
    return new Promise(function (resolve, reject) {
        var options = {
            method: 'GET',
            hostname: 'api.spotify.com',
            path: '/v1/tracks/' + id,
            headers: {
                Authorization: 'Bearer ' + token,
                'User-Agent': 'PostmanRuntime/7.11.0',
                Accept: '*/*',
                'Cache-Control': 'no-cache',
                'Postman-Token':
                    '1bfda26b-dd8e-457b-b787-f4b5b9702287,8b1fb686-5bc2-4cc6-ba54-4fe75a9330b4',
                Host: 'api.spotify.com',
                'accept-encoding': 'json',
                Connection: 'keep-alive',
                'cache-control': 'no-cache',
            },
        }

        var req = http.request(options, function (res) {
            var chunks = []
            res.on('data', function (chunk) {
                chunks.push(chunk)
            })

            res.on('end', function () {
                var all_tracks = []
                var body = Buffer.concat(chunks)
                var track_json = JSON.parse(body)
                var track = {
                    artist: track_json.artists[0].name,
                    name: track_json.name,
                    album: track_json.album.name,
                }
                all_tracks.push(track)
                resolve(all_tracks)
            })
            req.on('error', function (err) {
                // This is not a "Second reject", just a different sort of failure
                reject(err)
            })
        })
        req.end()
    })
}

async function searchDeezer(artist, track, album) {
    return new Promise(function (resolve, reject) {
        var parsed_url_1 =
            'https://api.deezer.com/search?q=artist:%22' +
            artist +
            '%22%20track:%22' +
            track.replace(/ *\([^)]*\) */g, '') +
            '%22'
        parsed_url_1 = parsed_url_1
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')

        var parsed_url =
            'https://api.deezer.com/search?q=' +
            artist +
            '%20' +
            track.replace(/ *\([^)]*\) */g, '') +
            '%20' +
            album.replace(/ *\([^)]*\) */g, '')
        parsed_url = parsed_url.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        var options = {
            method: 'GET',
            url: parsed_url,
        }

        request(options, function (error, response, body) {
            if (error) {
                reject(err)
                throw new Error(error)
            }
            var json = JSON.parse(body)

            var search = track.replace(/[^\w\s]/gi, '')
            search = search.replace(/\s\s+/g, ' ').toLowerCase()
            search = search.replace(/ *\([^)]*\) */g, '')
            search += ' ' + artist
            if (typeof album !== 'undefined' && album) {
                search += ' ' + album
            }

            foundTrackSet = FuzzySet()
            var foundTracks = []
            var foundTitles = []
            var foundArtists = []
            var foundAlbums = []
            var foundURLs = []

            for (x = 0; x < json.data.length; x++) {
                var foundTitle = json.data[x].title.replace(/[^\w\s]/gi, '')
                var foundTitle = foundTitle.replace(/\s\s+/g, ' ')
                var foundArtist = json.data[x].artist.name
                var foundAlbum = json.data[x].album.title

                foundTitles.push(foundTitle.toLowerCase())
                foundArtists.push(foundArtist)
                foundAlbums.push(foundAlbum)

                foundTracks.push(
                    foundTitle.toLowerCase() +
                        ' ' +
                        foundArtist +
                        ' ' +
                        foundAlbum
                )
                foundTrackSet.add(
                    foundTitle.toLowerCase() +
                        ' ' +
                        foundArtist +
                        ' ' +
                        foundAlbum
                )
                foundURLs.push(json.data[x].link)
            }

            var scores = foundTrackSet.get(search, '', [(minScore = 0.01)])
            var highestscore = 0
            var bestMatch = ''
            for (m = 0; m < scores.length; m++) {
                if (scores[m][0] > highestscore) {
                    highestscore = scores[m][0]
                    bestMatch = scores[m][1]
                }
            }

            var found = false
            if (bestMatch != '') {
                found = true
                var indexBestTitle = foundTracks.indexOf(bestMatch)
                var url = foundURLs[indexBestTitle]

                var deezerArtist = foundArtists[indexBestTitle]
                var deezerAlbum = foundAlbums[indexBestTitle]
                var deezerTrack = foundTitles[indexBestTitle]

                fs.appendFile(
                    'downloadFormatted.txt',
                    deezerArtist +
                        '\\' +
                        deezerAlbum +
                        '\\' +
                        deezerTrack +
                        '\n',
                    function (err) {
                        if (err) throw err
                    }
                )
                resolve(url)
            }

            if (!found) {
                fs.appendFile(
                    'notFoundTracks.txt',
                    'Spotify: ' +
                        artist +
                        '::' +
                        album +
                        '::' +
                        track + 
                        '\n',
                    function (err) {
                        if (err) throw err
                        console.log('not found:' + track)
                    }
                )
            }

            resolve('')
        })
    })
}

async function authorize() {
    return new Promise(function (resolve, reject) {
        var client_id = spotify_client_id
        var client_secret = spotify_client_secret

        // your application requests authorization
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                Authorization:
                    'Basic ' +
                    Buffer.from(client_id + ':' + client_secret).toString(
                        'base64'
                    ),
            },
            form: {
                grant_type: 'client_credentials',
            },
            json: true,
        }

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                // use the access token to access the Spotify Web API
                resolve(body.access_token)
            } else {
                reject('Spotify client id / secret not correct')
            }
        })
    })
}

async function readNewSpotifyTokens() {
    const questions = [
        {
            type: 'text',
            name: 'promptclientid',
            message: 'Spotify Client ID: ',
        },
        {
            type: 'text',
            name: 'promptclientsecret',
            message: 'Spofity Secret Token: ',
        },
    ]

    await (async () => {
        const response = await prompts(questions)
        // Use in current program
        spotify_client_id = response.promptclientid
        spotify_client_secret = response.promptclientsecret

        // Write to file
        var obj = {
            spotify_client_id: response.promptclientid,
            spotify_client_secret: response.promptclientsecret,
        }
        var jsontext = JSON.stringify(obj)
        fs.writeFile('./SpotifyConfig.json', jsontext, 'utf8', function (err) {
            if (err) {
                console.log(
                    'An error occured while writing JSON Object to File.'
                )
                return console.log(err)
            }
            console.log('JSON file has been saved.')
        })
    })()
}

function cleanupFiles() {
    // reset to clean setup
    if (fs.existsSync('./downloadFormatted.txt')) {
        fs.unlinkSync('./downloadFormatted.txt', function () {
            console.log('formatted txt deleted')
        })
    }
    if (fs.existsSync('./notFoundTracks.txt')) {
        fs.unlinkSync('./notFoundTracks.txt', function () {
            console.log('notFoundTracks deleted')
        })
    }
    if (fs.existsSync('./downloadLinks.txt')) {
        fs.unlinkSync('./downloadLinks.txt', function () {
            console.log('downloadlinks deleted')
        })
    }
}

async function setupSpotifyTokens() {
    if (fs.existsSync('./SpotifyConfig.json')) {
        // Read spotify token
        let rawconfig = fs.readFileSync('./SpotifyConfig.json')
        try {
            let spotify_config = JSON.parse(rawconfig)
            // read token and secret
            spotify_client_id = spotify_config.spotify_client_id
            spotify_client_secret = spotify_config.spotify_client_secret
        } catch (error) {
            console.log(
                'Problem reading spotify config file (SpotifyConfig.json)'
            )
            fs.unlinkSync('./SpotifyConfig.json', function () {
                console.log('Spotify config deleted')
            })
            await readNewSpotifyTokens()
        }
    } else {
        await readNewSpotifyTokens()
    }
}

function parseAndHandleSpotifyUrl(url) {
    // Parse Url
    if (url.indexOf('track') > -1) {
        console.log(url)
        var string_split = url.split('/')
        var id = string_split[string_split.length - 1]
        getTrack(id, token).then(async function (body) {
            for (i = 0; i < body.length; i++) {
                var url = await searchDeezer(
                    body[i].artist,
                    body[i].name,
                    body[i].album
                )
                if (url.length > 0) {
                    fs.appendFile('downloadLinks.txt', url + '\n', function (
                        err
                    ) {
                        if (err) throw err
                        console.log('added: ' + url)
                    })
                }
            }
        })
    } else if (url.indexOf('album') > -1) {
        console.log(url)
        var string_split = url.split('/')
        var id = string_split[string_split.length - 1]
        getAlbum(id, token).then(async function (body) {
            for (i = 0; i < body.length; i++) {
                var url = await searchDeezer(
                    body[i].artist,
                    body[i].name,
                    body[i].album
                )
                if (url.length > 0) {
                    fs.appendFile('downloadLinks.txt', url + '\n', function (
                        err
                    ) {
                        if (err) throw err
                        console.log('added: ' + url)
                    })
                }
            }
        })
    } else if (url.indexOf('playlist') > -1) {
        console.log(url)
        var string_split = url.split('/')
        var id = string_split[string_split.length - 1]
        getPlaylist(id, token).then(async function (body) {
            for (i = 0; i < body.length; i++) {
                var url = await searchDeezer(
                    body[i].artist,
                    body[i].name,
                    body[i].album
                )

                if (url.length > 0) {
                    fs.appendFile('downloadLinks.txt', url + '\n', function (
                        err
                    ) {
                        if (err) throw err
                        console.log('added: ' + url)
                    })
                }
            }
        })
    }
}

async function main() {
    cleanupFiles()

    await setupSpotifyTokens()

    // Spotify Authorization
    token = await authorize().catch(function (error) {
        console.log(error)
        if (fs.existsSync('./SpotifyConfig.json')) {
            fs.unlinkSync('./SpotifyConfig.json', function () {
                console.log('Spotify config deleted')
            })
        }
        process.exit()
    })

    // Spotify Url
    var url = process.argv.slice(2)[0]
    parseAndHandleSpotifyUrl(url)
}

main()
