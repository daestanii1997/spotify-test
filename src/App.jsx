import { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import Listbox from './Listbox';
import Detail from './Detail';
import { Credentials } from './Credentials';
import Header from './Header.jsx'
import axios from 'axios';
import { PropTypes } from 'prop-types';

const App = () => {
  
  console.log('RENDERING APP.JS');
  console.log('test')
  
  const spotify = Credentials();  
  const clientId = "b59cdff7fd2249bc9e1c068238e2f281";
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  const [token, setToken] = useState({});
  const [genres, setGenres] = useState({selectedGenre: '', listOfGenresFromAPI: []});
  const [playlist, setPlaylist] = useState({selectedPlaylist: '', listOfPlaylistFromAPI: []});
  const [tracks, setTracks] = useState({selectedTrack: '', listOfTracksFromAPI: []});
  const [trackDetail, setTrackDetail] = useState(null);

  useEffect(() => {

    axios('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 
          'Basic ' + btoa(spotify.ClientId + ':' + spotify.ClientSecret)      
      },
      data: 'grant_type=client_credentials',
    })
    .then(tokenResponse => {      
      let spotifyToken = tokenResponse.data.access_token;
      setToken(spotifyToken);
      console.log(spotifyToken);

      axios('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + spotifyToken }
      })
      .then (genreResponse => {        
        setGenres({
          selectedGenre: genres.selectedGenre,
          listOfGenresFromAPI: genreResponse.data.categories.items
        })

      }) .catch(err => {
        console.log(err);
      })
    });

  }, []);


  if (!code) {
    redirectToAuthCodeFlow(clientId);
  }

  // redirect to spotify login/auth page
  async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://dae-spotify-test.netlify.app/callback");
    params.append(
      "scope",
      "user-read-private user-read-email playlist-modify-public playlist-modify-private"
    );
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  function generateCodeVerifier(length) {
    let text = "";
    let possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const genreChanged = val => {
    setGenres({
      selectedGenre: val, 
      listOfGenresFromAPI: genres.listOfGenresFromAPI
    });

    axios(`https://api.spotify.com/v1/browse/categories/${val}/playlists?limit=10`, {
      method: 'GET',
      headers: { 'Authorization' : 'Bearer ' + token}
    })
    .then(playlistResponse => {
      console.log('PLAYLISTS: ' , playlistResponse);
      setPlaylist({
        selectedPlaylist: playlist.selectedPlaylist,
        listOfPlaylistFromAPI: playlistResponse.data.playlists.items
      })
    });

    // console.log(val);
  }

  const playlistChanged = val => {
    // console.log(val);
    setPlaylist({
      selectedPlaylist: val,
      listOfPlaylistFromAPI: playlist.listOfPlaylistFromAPI
    });
  }

  const buttonClicked = e => {
    e.preventDefault();

    axios(`https://api.spotify.com/v1/playlists/${playlist.selectedPlaylist}/tracks?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization' : 'Bearer ' + token
      }
    })
    .then(tracksResponse => {
      setTracks({
        selectedTrack: tracks.selectedTrack,
        listOfTracksFromAPI: tracksResponse.data.items
      })
    });
  }

  const listboxClicked = val => {

    const currentTracks = [...tracks.listOfTracksFromAPI];

    const trackInfo = currentTracks.filter(t => t.track.id === val);

    setTrackDetail(trackInfo[0].track);

  }

  App.PropTypes = {
    token: PropTypes.string,
    genres: PropTypes.array,
    playlist: PropTypes.array,
    tracks: PropTypes.array,
    trackDetail: PropTypes.array,
    genreChanged: PropTypes.func,
    playlistChanged: PropTypes.func,
    buttonClicked: PropTypes.func,
    listboxClicked: PropTypes.func,
  }

  return (
    <div className="container">
      <Header token={{token}} />
      {/* <Dropdown 
        options={genres.listOfGenresFromAPI}
        selectedGenre={genres.selectedGenre}
        listOfGenresFromAPI={genres.listOfGenresFromAPI}
        genreChanged={genreChanged}
      /> 
      <Listbox 
        selectedPlaylist={playlist.selectedPlaylist}
        listOfPlaylistFromAPI={playlist.listOfPlaylistFromAPI}
        playlistChanged={playlistChanged}
      />
      <Detail 
        selectedTrack={tracks.selectedTrack}
        listOfTracksFromAPI={tracks.listOfTracksFromAPI}
        trackDetail={trackDetail}
        listboxClicked={listboxClicked}
      /> */}
      <form onSubmit={buttonClicked}>        
          <Dropdown label="Genre :" options={genres.listOfGenresFromAPI} selectedValue={genres.selectedGenre} changed={genreChanged} />
          <Dropdown label="Playlist :" options={playlist.listOfPlaylistFromAPI} selectedValue={playlist.selectedPlaylist} changed={playlistChanged} />
          <div className="col-sm-6 row form-group px-0">
            <button type='submit' className="btn btn-success col-sm-12">
              Search
            </button>
          </div>
          <div className="row">
            <Listbox items={tracks.listOfTracksFromAPI} clicked={listboxClicked} />
            {trackDetail && <Detail {...trackDetail} /> }
          </div>        
      </form>
    </div>
    
  );
}

export default App;