import { useEffect, useState } from 'react'
import { CardSdk, getKeyFromBlob, type CardEventHandler, type CardInitData, type CardInitErrorPayload, type CardUser } from 'dome-embedded-app-sdk';
import './App.css'

function App() {
   // User object state
   const [user, setUser] = useState<CardUser | null>(null);
   const [uiPref, setUiPref] = useState<CardUser | null>(null);
   // store the SDK state to access it later
   const [sdk, setSdk] = useState<CardSdk | null>(null);
   const [initError, setInitError] = useState<CardInitErrorPayload | null>(null);

   useEffect(() => {
     // decryption blob for the card shared with devs goes here
     const reactStarterDecBlob = {v: 0, seed: 0, obf: []};

     // Handle dome card events
     const eventHandler: CardEventHandler = {
      // here you will recieve the init data with user info, theme, permissions etc.
       onInit: (data: CardInitData) => {
        const { user, ui } = data;

         user && setUser(user);

         if (ui && ui?.theme) {
          setUiPref(ui);
          document.documentElement.setAttribute('data-theme', ui.theme);
         }
       },
       // onInitError will return an error object with message and error_code if initialization fails
       onInitError: (data: any) => {
        setInitError(data);
       },
       onError: (data: { message: string; error_code: string | number; }) => {
         console.error("Some Error", `${data.message} (${data.error_code})`);
       },
     };

     // Initialize card with secret code and event handler
     CardSdk.init(getKeyFromBlob(reactStarterDecBlob), eventHandler)
       .then((sdk) => {
        setSdk(sdk);
        console.debug("React Starter initialized");
       })
       .catch((err) => {
         console.error("Init failed", err);
       });
   }, []);

   return (
     <div className="main">
       {user ? (
         <>
           <h1>
             Hello, { user.getFullName?.() }
           </h1>
           <p>Congratulations! Your card is running. 🎉</p>
         </>
       ) : initError ? (
        <>
         <h3>Initialization Failed</h3>
         <p>{initError.message} {initError.error_code}</p>
        </>
       ) : (
          <p>Loading...</p>
       )}
     </div>
   );
}

export default App
