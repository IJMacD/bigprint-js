import { useEffect, useRef } from "react";

export function Modal ({ className = "", onClose = () => {}, children }) {
    /** @type {import("react").MutableRefObject<HTMLDialogElement>} */
    const ref = useRef();

    useEffect(() => {
        // @ts-ignore
        if (ref.current && !ref.current.open) {
            // @ts-ignore
            ref.current.showModal();
        }
    }, []);

    /**
     * @param {import("react").MouseEvent<HTMLDialogElement>} e
     */
    function handleClick (e) {
        if (ref.current) {
            const bounds = ref.current.getBoundingClientRect();
            const outOfBounds = e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom;
            if (outOfBounds) {
                onClose();
            }
        }
    }

    return (
        <dialog className={`modal ${className}`} ref={ref} onClick={handleClick}>
            <button className="modal-close" onClick={onClose}>❌</button>
            {children}
        </dialog>
    );
}