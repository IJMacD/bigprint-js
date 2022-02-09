import { useState, useEffect } from "react";

export function useImage (src) {
    const [ image, setImage ] = useState(/** @type {HTMLImageElement} */(null));

    useEffect(() => {
        if (src) {
            const image = new Image();

            image.src = src;

            image.onload = () => setImage(image);
        } else {
            setImage(null);
        }
    }, [src, setImage]);

    return image;
}