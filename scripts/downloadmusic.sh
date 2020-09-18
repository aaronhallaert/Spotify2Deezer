#!/bin/bash
# used for Tasker implementation (with use of Termux)
# $1 = spotify url

# convert spotify to deezer url('s) --> downloadLinks.txt
node ~/SpotifyDeezerConverter/app-spot.js $1
wait

# copy the generated downloadLinks.txt file to the music folder
cp ~/downloadLinks.txt ~/storage/music/downloadLinks.txt
wait

cp ~/notFoundTracks.txt ~/storage/music/
wait

# download songs with SMLoadr based on the txt file
bash ~/SMLoadr.sh -o '-q MP3_320 -d all'
wait

am broadcast --user 0 -a tasker.downcomplete
