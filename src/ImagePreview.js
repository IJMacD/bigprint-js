import { useEffect, useRef, useState } from "react";
import { tiler } from "./tiler";
import { useImage } from "./useImage";

/**
 * @typedef {{label: string;width: number;height: number;}} Paper
 */

/**
 * @param {object} props
 * @param {string} props.src
 * @param {Paper} props.paper
 * @param {number} props.dpi
 * @param {number} props.overlap
 * @param {boolean} props.grid
 * @param {(image: HTMLImageElement, paper: Paper) => void} props.onGenerate
 * @param {(overlap: number) => void} props.setOverlap
 */
export function ImagePreview ({ src, paper, dpi, overlap, grid, onGenerate, setOverlap }) {
    const image = useImage(src);
    const canvasRef = useRef(/** @type {HTMLCanvasElement} */(null));
    const [ generated, setGenerated ] = useState(false);

    // CSS pixels
    const screenWidth = 500;
    // Diagonal Grid spacing in mm;
    const gridSize = 50;
    // Border in pixels (applied to all 4 sides)
    const border = 1;

    useEffect(() => {
        setGenerated(false);
    }, [image, paper, dpi, overlap, grid]);

    useEffect(() => {
        if (!image) {
            return;
        }

        const spec = tiler(image.width, image.height, dpi, paper, overlap);

        const paperRatio = spec.totalHeightMM / spec.totalWidthMM;

        const screenHeight = screenWidth * paperRatio;

        const screenPixelsPerMM = screenWidth / spec.totalWidthMM;

        if (canvasRef.current && spec.paperWidthWithOverlap > 0 && spec.paperHeightWithOverlap > 0) {

            const paperWidthPixels = paper.width * screenPixelsPerMM;
            const paperHeightPixels = paper.height * screenPixelsPerMM;

            const ctx = canvasRef.current.getContext("2d");

            ctx.translate(border * devicePixelRatio, border * devicePixelRatio);

            ctx.clearRect(0, 0, screenWidth * devicePixelRatio, screenHeight * devicePixelRatio);

            // Draw Page Overlaps
            ctx.beginPath();
            for (let i = 0; i < spec.hSheets; i++) {
                for (let j = 0; j < spec.vSheets; j++) {
                    const x0 = i * spec.paperWidthWithOverlap * screenPixelsPerMM * devicePixelRatio;
                    const y0 = j * spec.paperHeightWithOverlap * screenPixelsPerMM * devicePixelRatio;

                    ctx.rect(x0, y0, paperWidthPixels * devicePixelRatio, paperHeightPixels * devicePixelRatio);
                }
            }
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1 * devicePixelRatio;
            ctx.stroke();

            if (grid) {
                // Draw Alignment Grid
                ctx.beginPath();
                const max = spec.totalWidthMM + spec.totalHeightMM;
                for (let t = gridSize; t < max; t += gridSize) {
                    // t is in mm, convert to pixels
                    const p = t * screenPixelsPerMM * devicePixelRatio;

                    const h = spec.totalHeightMM * screenPixelsPerMM * devicePixelRatio;

                    // SW-NE
                    ctx.moveTo(0, p);
                    ctx.lineTo(p, 0);

                    // NW-SE
                    ctx.moveTo(0, h-p);
                    ctx.lineTo(p, h);
                }
                ctx.strokeStyle = "#008000";
                ctx.lineWidth = 0.25 * devicePixelRatio;
                ctx.stroke();
            }

            ctx.resetTransform();
        }
    }, [
        image, paper,
        paper.width, paper.height,
        dpi, overlap,
        grid,
    ]);

    if (!image) {
        return null;
    }

    const spec = tiler(image.width, image.height, dpi, paper, overlap);

    const imageScale = spec.widthMM / spec.totalWidthMM;
    const imageWidth = screenWidth * imageScale;

    const paperRatio = spec.totalHeightMM / spec.totalWidthMM;
    const screenHeight = screenWidth * paperRatio;

    function handleGenerate () {
        setGenerated(true);
        onGenerate(image, paper);
    }

    // function handleMaximiseOverlap () {
    //     const xScaleMax = spec.totalWidthMM / spec.widthMM;
    //     const yScaleMax = spec.totalHeightMM / spec.heightMM;

    //     if (xScaleMax === 1 || yScaleMax === 1) return;

    //     let newOverlap;

    //     if (xScaleMax > yScaleMax) {
    //         const { hSheets, widthMM, totalWidthMM } = spec;
    //         if (hSheets === 1) return;
    //         const slack = totalWidthMM - widthMM;
    //         newOverlap = overlap + slack / (hSheets - 1);
    //     }
    //     else {
    //         const { vSheets, heightMM, totalHeightMM } = spec;
    //         if (vSheets === 1) return;
    //         const slack = totalHeightMM - heightMM;
    //         newOverlap = overlap + slack / (vSheets - 1);
    //     }

    //     setOverlap(Math.floor(newOverlap));
    // }

    return (
        <div>
            <div style={{
                position: "relative",
                display: "inline-block",
                width: screenWidth,
                height: screenHeight,
                textAlign: "left",
                background: "#EEEEEE",
            }}>
                <img src={src} style={{ width: imageWidth }} alt={`${paper.label} Preview`} />
                <canvas
                    ref={canvasRef}
                    width={screenWidth * devicePixelRatio + border * 2 * devicePixelRatio}
                    height={screenHeight * devicePixelRatio + border * 2 * devicePixelRatio}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: screenWidth + border * 2,
                        height: screenHeight + border * 2,
                    }}
                />
            </div>

            <p>{spec.hSheets} {plural(spec.hSheets, "sheet")} × {spec.vSheets} {plural(spec.vSheets, "sheet")} = {spec.hSheets * spec.vSheets} {plural(spec.hSheets * spec.vSheets, "sheet")} total ({(spec.hSheets * paper.width * spec.vSheets * paper.height / 1e6).toFixed(3)} m² Total Area)</p>

            <p>
                <button onClick={handleGenerate} disabled={!image || generated}>Generate</button>
                {/* <button onClick={handleMaximiseOverlap} disabled={!image}>Maximise Overlap</button> */}
            </p>
        </div>
    );
}

function plural (n, singular, plural = singular + "s") {
    return n === 1 ? singular : plural;
}