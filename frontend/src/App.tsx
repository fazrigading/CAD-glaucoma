import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ErrorBoundary } from "./components/general/ErrorBoundary"
import Overview from "./pages/Overview"
import Model from "./pages/Model"
import { default as Correction } from "./pages/Correction"
import History from "./pages/History"
import Login from "./pages/Login"

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Overview/>} />
          <Route path="/model" element={<Model/>} />
          <Route path="/correction" element={<Correction/>} />
          <Route path="/history" element={<History/>} />
          <Route path="/login" element={<Login/>} />
        </Routes> 
      </BrowserRouter>      
    </ErrorBoundary>
  )
}

export default App;
