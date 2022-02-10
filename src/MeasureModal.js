import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

const PREVIEW_SIZE = 500;
const INCH_TO_MM = 25.4;

/**
 *
 * @param {object} props
 * @param {string} props.src
 * @param {number} props.dpi
 * @param {(dpi: number) => void} props.onSave
 * @returns
 */
export function MeasureModal ({ src, dpi: originalDPI, onSave, ...otherProps }) {
  const [ width, setWidth ] = useState(0);
  const [ height, setHeight ] = useState(0);
  /** @type {import("react").MutableRefObject<HTMLCanvasElement>} */
  const canvasRef = useRef();
  const [ lineLength, setLineLength ] = useState(0);
  const [ point0, setPoint0 ] = useState(/** @type {[number, number]} */(null));
  const [ point1, setPoint1 ] = useState(/** @type {[number, number]} */(null));
  const [ pointTemp, setPointTemp ] = useState(/** @type {[number, number]} */(null));
  const [ dpi, setDPI ] = useState(originalDPI);

  const previewScale = PREVIEW_SIZE / width;

  useEffect(() => {
    if (lineLength && point0 && point1) {
      setDPI(calcLineLength(point0, point1) / lineLength * INCH_TO_MM);
    }
  }, [lineLength, point0, point1]);

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

    if (!point0 || point1) {
      setPoint0(scaledPoint);
      setPoint1(null);
    } else if (point0) {
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
      setPointTemp(null);

      if (dpi) {
        setLineLength(calcLineLength(point0, scaledPoint) / dpi * INCH_TO_MM);
      }
    }
  }

  function handleMouseMove (e) {
    if (!point0 || point1) return;

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

    setPointTemp(scaledPoint);
  }

  const imageRatio = height / width;
  const calculatedHeight = (PREVIEW_SIZE * imageRatio) || 0;

  const canvasIntrinsicWidth = PREVIEW_SIZE * devicePixelRatio;
  const canvasIntrinsicHeight = calculatedHeight * devicePixelRatio;

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasIntrinsicWidth, canvasIntrinsicHeight);

    const p = point1 || pointTemp;

    if (!p) return;

    const x0 = point0[0] * previewScale * devicePixelRatio;
    const y0 = point0[1] * previewScale * devicePixelRatio;
    const x1 = p[0] * previewScale * devicePixelRatio;
    const y1 = p[1] * previewScale * devicePixelRatio;
    const ll = calcLineLength(point0, p);
    const l = ll * previewScale * devicePixelRatio;
    const llmm = ll / dpi * INCH_TO_MM;
    const ts = 5 * devicePixelRatio;
    const fontSize = 14 * devicePixelRatio;
    const to = (y0 <  fontSize && y1 < fontSize) ? fontSize : -2 * devicePixelRatio;

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
    ctx.strokeStyle = point1 ? "#000000" : "#008000";
    ctx.stroke();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(`${llmm.toFixed()}mm`, l / 2, to);

    ctx.resetTransform();
  }, [point0, point1, pointTemp, canvasIntrinsicWidth, canvasIntrinsicHeight, previewScale, dpi]);


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
        <label>
          Line Length
          <input type="number" value={lineLength} onChange={e => setLineLength(+e.target.value)} style={{ margin: "0 0.5em", width: 100 }} />
          mm
        </label>
        <p>
          {dpi.toFixed()} dpi
          <button onClick={() => onSave(Math.round(dpi))} style={{margin:"0.5em"}}>Save</button>
        </p>
      </Modal>
  );
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