import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { useState,useEffect} from 'react'
import Home from './views/Home'
import Login from './views/Login'
import SignUp from './views/SignUp'
import Navbar from './views/partials/Navbar'
import { currentUser, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Upload from './views/Upload'

function App() {
  const [loggedIn, setLoggedIn] = useState(currentUser || false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(user);
    })
    return unsubscribe;
  }, [])
  
  const router = createBrowserRouter([
    {
      path:'/',
      element: <Navbar />,
      children: [
        {
          path: '/',
          element: loggedIn? <Home uid={loggedIn.uid} /> : <Navigate to='/login'/>
        },
        {
          path: '/login',
          element: loggedIn? <Navigate to='/' />: <Login />
          },
        {
          path: '/signup',
          element: loggedIn? <Navigate to='/' /> : <SignUp />
        },
        {
          path: '/uploadImage',
          element: loggedIn ? <Upload email={loggedIn.email} uid={loggedIn.uid} /> : <Navigate to='/login'/>

        }
      ]
  }
  ])

  return (
    <RouterProvider router={router}/>
  )
}

export default App
