import { useImage } from "./useImage";

const INCH_TO_MM = 25.4;

export function ImageStats ({ src, dpi }) {
  const image = useImage(src);

    if (!image) {
        return null;
    }

    const widthInches = image.width / dpi;
    const heightInches = image.height / dpi;

    const widthMM = widthInches * INCH_TO_MM;
    const heightMM = heightInches * INCH_TO_MM;

    return (
        <p style={{fontWeight:"bold"}}>
            {image.width} px × {image.height} px @ {dpi} dpi<br/>
            ({widthInches.toFixed(1)}″ × {heightInches.toFixed(1)}″)<br/>
            ({widthMM.toFixed(0)} mm × {heightMM.toFixed(0)} mm)
        </p>
    );
}