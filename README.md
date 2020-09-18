# Spotify2Deezer - Convert Spotify urls to Deezers counterpart

## Features and Usage
The application is able to convert 95% of Spotify urls of single tracks, playlists and albums (not podcasts)

Pass through a Spotify url and all the corresponding Deezer urls will be placed in the file `downloadLinks.txt`.
Songs that are not found will be reported in the file `notFoundTracks.txt`. 
While searching on Deezer, the best match for every song will be placed in the file `downloadFormatted.txt` 
with the following format `[Artist]\[Album]\[Track]`. 

Run the application with NodeJS:
```javascript
node app.js "<spotify-url>"
```

## Installation
### Prerequisites
* NodeJS
* Spotify client id and secret (Make a project on the Spotify Developer page)

### Install
* Clone this [repo](https://www.github.com/aaronhallaert/Spotify2Deezer.git)
* Navigate in the repository
* Execute `npm install`
* The first time you execute the script, you will be prompted to enter your Spotify Client ID and secret



## Known Issues
* Too large playlists cause crash of script
