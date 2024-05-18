import { useEffect, useState } from 'react';
import './App.css';
import { ImagePreview } from './ImagePreview';
import { ImageStats } from './ImageStats';
import { MeasureModal } from './MeasureModal';
import { pdfPreview } from './pdfPreview';

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

/**
 * @typedef {"Dashed"|"Solid"} OverlapStyle
 * @typedef {"None"|"NE"|"NW"|"SE"|"SW"|"Both"} OverlapPosition
 * @typedef {"None"|"Front"|"Back"} GridPlacement
 */

function App() {
  const [file, setFile] = useState(/** @type {File} */(null));
  const [previewURL, setPreviewURL] = useState(/** @type {string} */(null));
  const [dpi, setDPI] = useState(96);
  // const [ selectedPaperSize, setSelectedPaperSize ] = useState(0);
  // Overlap in mm
  const [overlap, setOverlap] = useState(10);
  const [gridPlacement, setGridPlacement] = useState(/** @type {GridPlacement} */("None"));
  const [overlapStyle, setOverlapStyle] = useState(/** @type {OverlapStyle} */("Dashed"));
  const [overlapPosition, setOverlapPosition] = useState(/** @type {OverlapPosition} */("Both"));

  const [isMeasureModalVisible, setIsMeasureModalVisible] = useState(false);

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
  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  /**
   * @param {HTMLImageElement} image
   * @param {import('./ImagePreview').Paper} paper
   */
  function handleGenerate(image, paper) {
    if (!image) {
      return;
    }

    const outputEl = document.getElementById("pdf-preview");

    if (outputEl) {
      window.scrollTo(0, outputEl.offsetTop);

      // Hmmmm, very much non-react...
      outputEl.innerHTML = `<p style="margin: 1em 0.5em;">Generating...</p>`;
      setTimeout(() => {
        pdfPreview(image, dpi, paper, overlap, gridPlacement, overlapPosition, overlapStyle, "#pdf-preview");
      }, 0);
    }
  }

  return (
    <div className="App">
      <div className="side-panel">
        <h2>BigPrint.JS</h2>
        <div className="settings">
          <input type="file" onChange={handleFileChange} accept=".png,.jpg" />

          <ImageStats src={previewURL} dpi={dpi} />
          {
            previewURL &&
            <p>
              <button onClick={() => setIsMeasureModalVisible(true)}>Measure Image</button>
            </p>
          }

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
            Show Diagonal Grid{' '}
            <select value={gridPlacement} onChange={e => setGridPlacement(e.target.value)}>
              <option value="None">None</option>
              <option value="Front">Front</option>
              <option value="Back">Back</option>
            </select>
          </label>
          <label>
            Overlap Marker Position{' '}
            <select value={overlapPosition} onChange={e => setOverlapPosition(e.target.value)}>
              <option value="None">None</option>
              <option value="NE">NE</option>
              <option value="NW">NW</option>
              <option value="SE">SE</option>
              <option value="SW">SW</option>
              <option value="Both">Both</option>
            </select>
          </label>
          <label>
            Overlap Style{' '}
            <select value={overlapStyle} onChange={e => setOverlapStyle(e.target.value)}>
              <option value="Dashed">Dashed</option>
              <option value="Solid">Solid</option>
            </select>
          </label>
        </div>

        <div className="credits">
          <p>
            Inspired by <a href="https://woodgears.ca/bigprint/">Matthias Wandel</a>.<br />
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
                  grid={gridPlacement !== "None"}
                  onGenerate={handleGenerate}
                  setOverlap={setOverlap}
                  overlapPosition={overlapPosition}
                  overlapStyle={overlapStyle}
                />
              </div>
            )) :
            <p>Choose an image file to begin.</p>
        }
      </div>

      <div id="pdf-preview">
        {
          file && <p>Press "Generate" to generate PDF</p>
        }
      </div>

      {
        isMeasureModalVisible && <MeasureModal src={previewURL} dpi={dpi} onClose={() => setIsMeasureModalVisible(false)} onSave={dpi => { setDPI(dpi); setIsMeasureModalVisible(false); }} />
      }

    </div>
  );
}

export default App;
