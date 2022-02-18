

let showAllSongs = true
function changeSongs () { 
    showAllSongs = ! showAllSongs
     console.log('showAllSongs: ', showAllSongs)
     return showAllSongs;
} 


module.exports = changeSongs;