import {
  type AriaAttributes,
  type PropsWithChildren,
  type SyntheticEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { assert } from "./utils";
import "./ModalDialog.css";

/** Typing our props this way helps prevent one being set but not the other.
 * Both props must be set or neither must be set to avoid bugs between the dialog.open property and component's isOpen state.
 */
type ModalDialogIsOpenProps =
  | {
      /** is the dialog open / visible. Set this to use ModalDialog as a controlled component. */
      isOpen: boolean;
      /** function that changes the component's isOpen state. Set this to use ModalDialog as a controlled component. */
      setIsOpen: (value: boolean) => void;
    }
  | {
      isOpen?: never;
      setIsOpen?: never;
    };

export type ModalDialogProps = PropsWithChildren &
  ModalDialogIsOpenProps &
  Pick<
    AriaAttributes,
    "aria-labelledby" | "aria-label" | "aria-describedby" | "aria-description"
  > & {
    /** should a user be able to dismiss the dialog by clicking outside of it? */
    shouldLightDismiss?: boolean;
    /** should the dialog be open by default? */
    initialOpen?: boolean;
    /** callback function to run when the dialog is closed */
    onClose?: (event?: SyntheticEvent) => void;
  };

/** The allow listed properties of the HTML dialog element exposed to the parent in a ref. We do not expose all properties (specifically dialog.show() and dialog.open) to prevent improper use of the dialog element (e.g. as a _non-modal_ dialog). */
export interface ModalDialogRef
  extends Pick<
    HTMLDialogElement,
    "addEventListener" | "removeEventListener" | "close" | "showModal"
  > {
  /** is the dialog's open property set to true
   * Intentionally makes the dialog's `open` property read-only. We DO NOT want to set the `open` attribute/property using JSX or JavaScript as it will break the modal functionality. */
  isOpen: () => boolean;
}

/** prevents calling dialog.showModal() when it is already visible, as doing so will throw an error */
function safelyOpenDialogAsModal(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

/** An accessible _modal dialog_ that utilizes the HTML <dialog> element */
export const ModalDialog = forwardRef<ModalDialogRef, ModalDialogProps>(
  function (
    {
      shouldLightDismiss = true,
      initialOpen = false,
      isOpen: controlledOpen,
      setIsOpen: setControlledOpen,
      onClose,
      children,
      ...props
    },
    forwardedRef,
  ) {
    if (process.env.NODE_ENV !== "production") {
      // assert that the ModalDialog has an accessible name via either the aria-labelledby (preferred) or aria-label (fallback) ARIA attribute
      assert(
        !(!props["aria-label"] && !props["aria-labelledby"]),
        'The <ModalDialog /> component must have an accessible name! Either pass "aria-labelledby" the ID attribute value of a heading that describes the Modal\'s content, or pass "aria-label" with a short description of the Modal\'s purpose.',
      );
    }

    const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
    const dialogRef = useRef<HTMLDialogElement>(null);

    /** is the ModalDialog in an open / visible state */
    const isOpen = controlledOpen ?? uncontrolledOpen;
    /** updates the ModalDialog open / visible state */
    const setIsOpen = setControlledOpen ?? setUncontrolledOpen;

    /** Effect that syncs the HTML dialog element's `open` property with our `isOpen` state */
    useEffect(() => {
      const dialog = dialogRef.current;

      if (isOpen) {
        safelyOpenDialogAsModal(dialog);
      } else {
        dialog?.close();
      }

      // make sure to close the dialog on unmount
      return () => {
        dialog?.close();
      };
    }, [isOpen]);

    // Effect that handles:
    // 1. setting up a click event listener on the dialog to dismiss the modal by clicking outside of it (on its ::backdrop pseudo element).
    // 2. preventing the default event when the Escape key is pressed so that dialog.open and isOpen do not get out of sync
    useEffect(() => {
      // local variable prevents eslint error in clean up function below
      const dialog = dialogRef.current;

      function handleClose(event: Event | KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
      }

      /** Handles dismissing the modal when clicking outside of it / on the ::backdrop */
      function lightDismiss(event: Event) {
        const { target } = event;
        if (target instanceof Element && target.nodeName === "DIALOG") {
          handleClose(event);
        }
      }

      function closeOnEscape(event: KeyboardEvent) {
        if (event.code === "Escape") {
          handleClose(event);
        }
      }

      if (shouldLightDismiss) {
        dialog?.addEventListener("click", lightDismiss);
      }

      dialog?.addEventListener("keydown", closeOnEscape);

      return () => {
        if (shouldLightDismiss) {
          dialog?.removeEventListener("click", lightDismiss);
        }
        dialog?.removeEventListener("keydown", closeOnEscape);
      };
    }, [shouldLightDismiss, setIsOpen]);

    /** sets up the "allow listed" properties for a consumer of ModalDialog so that it may attach an event listener, and/or safely open or close the ModalDialog, via a ref */
    useImperativeHandle(forwardedRef, () => {
      return {
        close() {
          setIsOpen(false);
        },
        showModal() {
          setIsOpen(true);
        },
        isOpen() {
          return isOpen;
        },
        addEventListener(
          name: string,
          callback: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ) {
          dialogRef.current?.addEventListener(name, callback, options);
        },
        removeEventListener(
          name: string,
          callback: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ) {
          dialogRef.current?.removeEventListener(name, callback, options);
        },
      };
    }, [isOpen, setIsOpen]);

    return (
      <dialog
        ref={dialogRef}
        onClose={onClose}
        aria-labelledby={props["aria-labelledby"]}
        aria-label={props["aria-label"]}
        aria-describedby={props["aria-describedby"]}
        aria-description={props["aria-description"]}
      >
        {children}
      </dialog>
    );
  },
);
