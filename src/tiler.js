const INCH_TO_MM = 25.4;

export function tiler (imageWidth, imageHeight, dpi, paper, overlap) {
    const widthInches = imageWidth / dpi;
    const heightInches = imageHeight / dpi;

    const widthMM = widthInches * INCH_TO_MM;
    const heightMM = heightInches * INCH_TO_MM;

    const paperWidthWithOverlap = paper.width - overlap;
    const paperHeightWithOverlap = paper.height - overlap;

    const hSheets = Math.ceil((widthMM - overlap) / paperWidthWithOverlap);
    const vSheets = Math.ceil((heightMM - overlap) / paperHeightWithOverlap);

    const totalWidthMM = hSheets * paperWidthWithOverlap + overlap;
    const totalHeightMM = vSheets * paperHeightWithOverlap + overlap;

    return {
        widthInches,
        heightInches,
        widthMM,
        heightMM,
        paperWidthWithOverlap,
        paperHeightWithOverlap,
        hSheets,
        vSheets,
        totalWidthMM,
        totalHeightMM,
    };
}