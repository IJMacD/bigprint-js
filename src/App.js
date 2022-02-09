import jsPDF from 'jspdf';
import PDFObject from 'pdfobject';
import { useEffect, useState } from 'react';
import './App.css';
import { ImagePreview } from './ImagePreview';
import { ImageStats } from './ImageStats';
import { pdfPreview } from './pdfPreview';
import { tiler } from './tiler';

const DEBUG = false;

// Paper sizes in mm
const PAPER_SIZES = [
  {
    label: "A4 Portrait",
    format: "a4",
    orientation: "p",
    width: 210,
    height: 297,
  },
  {
    label: "A4 Landscape",
    format: "a4",
    orientation: "l",
    width: 297,
    height: 210,
  },
  {
    label: "A3 Portrait",
    format: "a3",
    orientation: "p",
    width: 297,
    height: 420,
  },
  {
    label: "A3 Landscape",
    format: "a3",
    orientation: "l",
    width: 420,
    height: 297,
  },
];

const GRID_SIZE = 50;

function App() {
  const [ file, setFile ] = useState(/** @type {File} */(null));
  const [ previewURL, setPreviewURL ] = useState(/** @type {string} */(null));
  const [ dpi, setDPI ] = useState(96);
  // const [ selectedPaperSize, setSelectedPaperSize ] = useState(0);
  // Overlap in mm
  const [ overlap, setOverlap ] = useState(10);
  const [ showGrid, setShowGrid ] = useState(false);

  useEffect(() => {
    if (file) {
      file.arrayBuffer().then(buffer => {
        const blob = new Blob([buffer]);
        setPreviewURL(URL.createObjectURL(blob));

      });
    } else {
      setPreviewURL(previewURL => {
        if (previewURL) {
          URL.revokeObjectURL(previewURL);
        }
        return null;
      });
    }
  }, [file]);

  /**
   *
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  function handleFileChange (e) {
    setFile(e.target.files[0]);
  }

  function handleGenerate (image, paper) {
      if (!image) {
          return;
      }

      window.scrollTo(0, document.getElementById("pdf-preview").offsetTop);

      setTimeout(() => pdfPreview(image, dpi, paper, overlap, showGrid, "#pdf-preview"), 0);
  }

  return (
    <div className="App">
      <div className="side-panel">
        <h2>BigPrint.JS</h2>
        <div className="settings">
          <input type="file" onChange={handleFileChange} accept=".png,.jpg" />

          <ImageStats src={previewURL} dpi={dpi} />

          <label>
            Image Density
            <input type="number" value={dpi} onChange={e => setDPI(+e.target.value)} /> dpi
          </label>
          {/* <label>
            Paper Size
            <select value={selectedPaperSize} onChange={e => setSelectedPaperSize(+e.target.value)}>
              {
                PAPER_SIZES.map((p, i) => <option value={i} key={i}>{p.label}</option>)
              }
            </select>
          </label> */}
          <label>
            Overlap
            <input type="number" value={overlap} onChange={e => setOverlap(+e.target.value)} /> mm
          </label>
          <label>
            Show Diagonal Grid
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
          </label>
        </div>
        <div className="credits">
          <p>
            Inspired by <a href="https://woodgears.ca/bigprint/">Matthias Wandel</a>.<br/>
            His version is paid but far more featured.
          </p>
          <p>View source on <a href="https://gitgub.com/IJMacD/bigprint-js">GitHub</a>.</p>
        </div>
      </div>

      <div className="previews">
      {
        file ?
          PAPER_SIZES.map((p, i) => (
            <div key={i}>
              <h2>{p.label}</h2>
              <ImagePreview
                src={previewURL}
                paper={p}
                dpi={dpi}
                overlap={overlap}
                grid={showGrid}
                onGenerate={handleGenerate}
                setOverlap={setOverlap}
              />
            </div>
          )) :
          <p>Choose image file to begin.</p>
      }
      </div>

      <div id="pdf-preview">
        {
          file && <p>Press "Generate" to generate PDF</p>
        }
      </div>

    </div>
  );
}

export default App;
