import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

const PREVIEW_SIZE = 500;
const INCH_TO_MM = 25.4;

/** @typedef {[number,number]} Point */

/** @typedef {{ id: number, points: [Point, Point], length: number }} MeasuredLine */

/**
 *
 * @param {object} props
 * @param {string} props.src
 * @param {number} props.dpi
 * @param {(dpi: number) => void} props.onSave
 * @returns
 */
export function MeasureModal ({ src, dpi: originalDPI, onSave, ...otherProps }) {
  const nextID = useRef(0);
  const [ width, setWidth ] = useState(0);
  const [ height, setHeight ] = useState(0);
  /** @type {import("react").MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = useRef();

  const [ point0, setPoint0 ] = useState(/** @type {Point} */(null));
  const [ point1, setPoint1 ] = useState(/** @type {Point} */(null));

  const [ lines, setLines ] = useState(/** @type {MeasuredLine[]} */([]));

  // const [ dpi, setDPI ] = useState(originalDPI);

  const previewScale = PREVIEW_SIZE / width;

  const dpi = (lines.length === 0) ? originalDPI : lines.reduce((sum, line) => sum + calcDPI(line), 0) / lines.length;

  /**
   * @param {number} id
   * @param {number} length
   */
  function setLineLength (id, length) {
    setLines(lines => {
      return lines.map(line => {
        if (line.id === id) {
          return { ...line, length };
        }
        return line;
      });
    });
  }

  /**
   * @param {React.ChangeEvent<HTMLImageElement>} e
   */
  function handleImageLoad (e) {
    setWidth(e.target.naturalWidth);
    setHeight(e.target.naturalHeight);
  }

  /** @param {React.MouseEvent<HTMLCanvasElement>} e */
  function handleCanvasClick (e) {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    /** @type {[number, number]} */
    const scaledPoint = [x / previewScale, y / previewScale];

    if (!point0) {
      setPoint0(scaledPoint);
    } else {
      if (e.ctrlKey) {
        const dx = Math.abs(point0[0] - scaledPoint[0]);
        const dy = Math.abs(point0[1] - scaledPoint[1]);

        if (dx < dy) {
          scaledPoint[0] = point0[0];
        } else {
          scaledPoint[1] = point0[1];
        }
      }

      const id = nextID.current++;

      setLines(lines => [ ...lines, { id, points: [point0, scaledPoint], length: Math.round(calcLineLength(point0, scaledPoint) / dpi * INCH_TO_MM) }]);

      setPoint0(null);
      setPoint1(null);
    }
  }

  function handleMouseMove (e) {
    if (!point0) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    /** @type {[number, number]} */
    const scaledPoint = [x / previewScale, y / previewScale];

    if (e.ctrlKey) {
      const dx = Math.abs(point0[0] - scaledPoint[0]);
      const dy = Math.abs(point0[1] - scaledPoint[1]);

      if (dx < dy) {
        scaledPoint[0] = point0[0];
      } else {
        scaledPoint[1] = point0[1];
      }
    }

    setPoint1(scaledPoint);
  }

  const imageRatio = height / width;
  const calculatedHeight = (PREVIEW_SIZE * imageRatio) || 0;

  const canvasIntrinsicWidth = PREVIEW_SIZE * devicePixelRatio;
  const canvasIntrinsicHeight = calculatedHeight * devicePixelRatio;

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasIntrinsicWidth, canvasIntrinsicHeight);

    if (point0 && point1) {
      const length = calcLineLength(point0, point1) / dpi * INCH_TO_MM;
      drawLine(ctx, point0,point1, previewScale, length, "#008000");
    }

    for (const line of lines) {
      drawLine(ctx, line.points[0], line.points[1], previewScale, line.length, "#000000");
    }
  }, [point0, point1, lines, dpi, canvasIntrinsicWidth, canvasIntrinsicHeight, previewScale]);


  return (
      <Modal className="measure-modal" { ...otherProps}>
        <h1>Measure Image DPI</h1>
        <div style={{position:"relative"}}>
          <img src={src} onLoad={handleImageLoad} style={{ width: PREVIEW_SIZE, maxHeight: 800 }} alt="Preview" />
          <canvas
            ref={canvasRef}
            width={canvasIntrinsicWidth}
            height={canvasIntrinsicHeight}
            style={{
              width: PREVIEW_SIZE,
              height: calculatedHeight,
              position: "absolute",
              top: 0,
              left: 0,
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          />
        </div>
        {
          lines.length > 0 &&
          <table>
            <thead>
              <tr><th>Number</th><th>Length (mm)</th><th>Calculated DPI</th><th></th></tr>
            </thead>
            <tbody>
            { lines.map(line =>
              <tr key={line.id}>
                <td>{line.id}</td>
                <td>
                  <label>
                    <input type="number" value={line.length} onChange={e => setLineLength(line.id, +e.target.value)} style={{ margin: "0 0.5em", width: 100 }} />
                    mm
                  </label>
                </td>
                <td>{calcDPI(line).toFixed()} dpi</td>
                <td><button onClick={() => setLines(lines => lines.filter(l => l.id !== line.id))}>Remove</button></td>
              </tr>
            ) }
            </tbody>
          </table>
        }
        <p>
          <span style={{fontWeight: "bold"}}>Average DPI</span><br/>
          {Math.round(dpi)} dpi
          <button onClick={() => onSave(Math.round(dpi))} style={{margin:"0.5em"}}>Save</button>
        </p>
      </Modal>
  );
}

function drawLine(ctx, point0, point1, previewScale, length, color) {
  const x0 = point0[0] * previewScale * devicePixelRatio;
  const y0 = point0[1] * previewScale * devicePixelRatio;
  const x1 = point1[0] * previewScale * devicePixelRatio;
  const y1 = point1[1] * previewScale * devicePixelRatio;
  const ts = 5 * devicePixelRatio;
  const fontSize = 14 * devicePixelRatio;
  const to = (y0 < fontSize && y1 < fontSize) ? fontSize : -2 * devicePixelRatio;
  const l = calcLineLength(point0, point1) * previewScale * devicePixelRatio;

  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.translate(x0, y0);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, -ts);
  ctx.lineTo(0, ts);
  ctx.moveTo(0, 0);
  ctx.lineTo(l, 0);
  ctx.moveTo(l, -ts);
  ctx.lineTo(l, ts);

  ctx.lineWidth = 2 * devicePixelRatio;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();
  ctx.lineWidth = 1 * devicePixelRatio;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.fillStyle = ctx.strokeStyle;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillText(`${length.toFixed()}mm`, l / 2, to);

  ctx.resetTransform();
}

/**
 * @param {[number, number]} p0
 * @param {[number, number]} p1
 */
function calcLineLength (p0, p1) {
  if (p0 === null || p1 === null) return 0;
  const a = p1[0] - p0[0];
  const b = p1[1] - p0[1];
  return Math.sqrt(a * a + b * b);
}

/**
 *
 * @param {MeasuredLine} line
 * @returns {number}
 */
function calcDPI(line) {
  return calcLineLength(...line.points) / line.length * INCH_TO_MM;
}