import axios from 'axios';
import { useState, useEffect } from 'react';

const Header = (token) => {
   const [user, setUser] = useState([]);

console.log(token.token.token);

   useEffect(() => {
     fetch('https://api.spotify.com/v1/me', {
       headers: {
         'Authorization': `Bearer ${token.token.token}`
       }
     })
   .then(res => {
       console.log(res);
       setUser(res.data);
       console.log(user);
     })
   .catch(err => {
       console.log(err);
     })
   }, [token]);

   

  return (

    <header className="container">
      <div>
        Profile Image: <img></img>
      </div>
      <h3>
        User ID: <span id="id"></span>
      </h3>
    </header>
  );
};

export default Header;
