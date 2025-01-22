import { Component, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// import ExcelUploader from './components/renderers/Excel2'
// import Excel2 from './components/renderers/Excel2'
// import ExcelUploader from './components/renderers/Excel3';
import ExcelUploader from './components/forms/Excel';
// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

function App(){
  return (
    
    <>
    <script src="http://localhost:8097"></script>
    <script src="/node_modules/fast-formula-parser/build/parser.min.js"> </script>
    <ExcelUploader/>
    </>
  )
}


export default App
