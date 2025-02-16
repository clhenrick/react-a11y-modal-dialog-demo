import { useState, useRef, useId } from "react";
import "./App.css";
import { ModalDialog, type ModalDialogRef } from "./ModalDialog";

function App() {
  /** used for the controlled ModalDialog */
  const [isOpen, setIsOpen] = useState(false);

  /** used for the uncontrolled ModalDialog */
  const dialogRef = useRef<ModalDialogRef>(null);

  const nameIdControlled = useId();
  const descIdControlled = useId();

  const nameIdUncontrolled = useId();
  const descIdUncontrolled = useId();

  const openControlled = () => {
    setIsOpen(true);
  };

  const closeControlled = () => {
    setIsOpen(false);
  };

  const openUnControlled = () => {
    dialogRef.current?.showModal();
  };

  const closeUncontrolled = () => {
    dialogRef.current?.close();
  };

  const onClose = () => {
    console.log("closed!");
  };

  return (
    <main>
      <h1>Accessible React Modal Dialog Demo</h1>
      <p>
        Read more at <a>TODO</a>
      </p>
      <div>
        <button className="open-modal" onClick={openControlled}>
          Open Controlled Dialog
        </button>
        <button className="open-modal" onClick={openUnControlled}>
          Open Uncontrolled Dialog
        </button>
      </div>

      {/* Controlled ModalDialog, uses the state scoped to App */}
      <ModalDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        aria-labelledby={nameIdControlled}
        aria-describedby={descIdControlled}
        onClose={onClose}
      >
        <div className="dialog-contents">
          <h2 id={nameIdControlled}>An Appropriate Title Might Go Here</h2>
          <p id={descIdControlled}>
            Here's where you might add a description to further justify my
            existence.
          </p>
          <button onClick={closeControlled}>Close Me</button>
        </div>
      </ModalDialog>

      {/* Uncontrolled ModalDialog, uses its own internal state */}
      <ModalDialog
        ref={dialogRef}
        aria-labelledby={nameIdUncontrolled}
        aria-describedby={descIdUncontrolled}
      >
        <div className="dialog-contents">
          <h2 id={nameIdUncontrolled}>
            An uncontrolled version of our Modal Dialog
          </h2>
          <p id={descIdUncontrolled}>Some Lorem Ipsum if you will</p>
          <button onClick={closeUncontrolled}>Close Me</button>
        </div>
      </ModalDialog>
    </main>
  );
}

export default App;
