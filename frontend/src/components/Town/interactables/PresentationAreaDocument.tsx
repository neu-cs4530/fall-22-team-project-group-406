import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PresentationAreaController from '../../../classes/PresentationAreaController';
import { useInteractable, usePresentationAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import PresentationAreaInteractable from './PresentationArea';
import SelectDocumentModal from './SelectDocumentModal';
import { throttle } from 'lodash';

const KEYBOARD_THROTTLE_MS = 150;

const useStyles = makeStyles({
  // style rule
  documentWrapper: () => ({
    alignItems: 'center',
    color: 'white',
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    fontSize: '2rem',
    justifyContent: 'start',
    position: 'relative',
    zIndex: 1,
  }),

  presentationBackground: () => ({
    backgroundColor: 'rgba(0,0,0,.8)',
    height: '100%',
    left: '0',
    position: 'fixed',
    top: '0',
    width: '100%',
  }),

  presentationHeader: () => ({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  }),

  slide: () => ({
    bottom: '2rem',
    fontSize: '1.5rem',
    left: '2rem',
    position: 'fixed',
  }),

  syncedTrue: () => ({
    backgroundColor: '#63F6FF',
    border: '1px solid #63F6FF',
    borderRadius: '.5rem',
    cursor: 'pointer',
    color: 'black',
    fontSize: '1.25rem',
    height: 'fit-content',
    left: '6.5rem',
    padding: '0rem 0.75rem .25rem .75rem',
    position: 'relative',
  }),

  syncedFalse: () => ({
    border: '1px solid #63F6FF',
    backgroundColor: 'transparent',
    borderRadius: '.5rem',
    cursor: 'pointer',
    color: '#63F6FF',
    fontSize: '1.25rem',
    height: 'fit-content',
    left: '6.5rem',
    padding: '0rem 0.75rem .25rem .75rem',
    position: 'relative',
  }),
});

/**
 * Mock component for a react-pdf document
 */
export class MockReactPdf extends Document {
  render(): React.ReactNode {
    return <></>;
  }
}

/**
 * The PresentationAreaDocument component renders a PresentationArea's document,
 * using the Document and page components.
 * The file property of the Document is set to the PresentationAreaController's
 * document property and the currentSlide is set, by default, to the controller's
 * slide property.
 *
 * The PresentationAreaDocument subscribes to the PresentationAreaController's events, and responds to
 * slideChange events by updating the current slide. In response to
 * documentChange events, the PresentationAreaDocument component will update the document being presented.
 *
 * @param props: A single property 'controller', which is the PresentationAreaController corresponding to the
 *               current presentation area.
 */
export function PresentationAreaDocument({
  controller,
  initialDocument,
}: {
  controller: PresentationAreaController;
  initialDocument: string;
}): JSX.Element {
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [document, setDocument] = useState<string | undefined>(initialDocument);
  const [currentSlide, setCurrentSlide] = useState<number>(controller.slide);
  const [localSlide, setLocalSlide] = useState<number>(controller.slide);
  const [shouldSync, setShouldSync] = useState<boolean>(true);
  const [numSlides, setNumSlides] = useState<number>(0);
  const townController = useTownController();

  const reactPdfRef = useRef<Document>(null);
  const reactPdfPageRef = useRef<Page>(null);

  const classes = useStyles();

  useEffect(() => {
    if (controller.numSlides !== 0) {
      setNumSlides(controller.numSlides);
    }
  }, [controller.numSlides]);

  useEffect(() => {
    const documentListener = (newDocument: string | undefined) => {
      setDocument(newDocument);
    };
    const slideListener = (newSlide: number) => {
      setCurrentSlide(newSlide);
      if (shouldSync) {
        // If we're syncing, then we should update the local slide to match the new slide
        setLocalSlide(newSlide);
      }
    };
    const numSlidesListener = (newNumSlides: number) => {
      setNumSlides(newNumSlides);
    };
    controller.addListener('documentChange', documentListener);
    controller.addListener('slideChange', slideListener);
    controller.addListener('numSlidesChange', numSlidesListener);
    return () => {
      controller.removeListener('documentChange', documentListener);
      controller.removeListener('slideChange', slideListener);
      controller.removeListener('numSlidesChange', numSlidesListener);
    };
  }, [controller, shouldSync]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldSync) {
        // If the user is currently syncing, we don't want to allow them to change slides
        return;
      }
      if (event.key === '1') {
        setLocalSlide(prevSlide => {
          if (prevSlide > 0) {
            return prevSlide - 1;
          }
          return prevSlide;
        });
      } else if (event.key === '2') {
        setLocalSlide(prevSlide => {
          if (prevSlide < controller.numSlides - 1) {
            return prevSlide + 1;
          }
          return prevSlide;
        });
      }
    };
    const throttledHandleKeyDown = throttle(handleKeyDown, KEYBOARD_THROTTLE_MS);
    window.addEventListener('keydown', throttledHandleKeyDown);
    return () => {
      window.removeEventListener('keydown', throttledHandleKeyDown);
    };
  }, [controller.numSlides, shouldSync]);

  useEffect(() => {
    if (shouldSync) {
      // If we start syncing, we should update the local slide to match the current slide
      setLocalSlide(currentSlide);
    }
  }, [currentSlide, shouldSync]);

  const activeSlide = shouldSync ? currentSlide : localSlide;

  return (
    <>
      <div className={classes.presentationHeader}>
        <h1>
          {/* Table name followed by the title of the presentation */}
          {controller.id}: {controller.title}
        </h1>
        {!isDocumentLoading && controller.presenter?.id !== townController.ourPlayer.id && (
          <button
            className={shouldSync ? classes.syncedTrue : classes.syncedFalse}
            onClick={() => setShouldSync(!shouldSync)}>
            {/* Checkbox to toggle whether the user's presentation should be synced with the presenter */}
            Sync
          </button>
        )}
      </div>
      <Document
        file={document}
        ref={reactPdfRef}
        renderMode='canvas'
        onLoadSuccess={(pdf: pdfjs.PDFDocumentProxy) => {
          controller.numSlides = pdf.numPages;
          setIsDocumentLoading(false);
        }}>
        <Page
          pageIndex={activeSlide}
          ref={reactPdfPageRef}
          scale={0.7}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          renderInteractiveForms={false}
          onRenderSuccess={() => {
            // Only presenter can emit changes for the document
            if (controller.presenter?.id === townController.ourPlayer.id) {
              townController.emitPresentationAreaUpdate(controller);
              controller.emit('numSlidesChange', numSlides);
            }
          }}
        />
      </Document>
      <p className={classes.slide}>
        Slide: {activeSlide + 1}/{numSlides}
      </p>
    </>
  );
}

/**
 * The PresentationArea monitors the player's interaction with a PresentationArea
 * on the map: displaying either a popup to configure a prentation,
 * or if the configuration is set, a presentation.
 *
 * @param props: the presentation area interactable that is being interacted with
 */
export function PresentationArea({
  presentationArea,
}: {
  presentationArea: PresentationAreaInteractable;
}): JSX.Element {
  const townController = useTownController();
  const presentationAreaController = usePresentationAreaController(presentationArea.name);
  const [selectIsOpen, setSelectIsOpen] = useState(
    presentationAreaController.document === undefined,
  );
  const [presentationAreaDocument, setPresentationAreaDocument] = useState(
    presentationAreaController.document,
  );
  useEffect(() => {
    const setDocument = (document: string | undefined) => {
      if (!document) {
        townController.interactableEmitter.emit('endIteraction', presentationAreaController);
      } else {
        setPresentationAreaDocument(document);
      }
    };
    presentationAreaController.addListener('documentChange', setDocument);
    return () => {
      presentationAreaController.removeListener('documentChange', setDocument);
    };
  }, [presentationAreaController, townController]);

  useEffect(() => {
    const setSlide = (event: KeyboardEvent) => {
      // guard clause to prevent changing slides from users besides the presenter
      if (presentationAreaController.presenter?.id !== townController.ourPlayer.id) {
        return;
      }
      if (event.key === '1') {
        presentationAreaController.slide -= 1;
      } else if (event.key === '2') {
        presentationAreaController.slide += 1;
      }
    };
    const throttledSetSlide = throttle(setSlide, KEYBOARD_THROTTLE_MS);
    document.addEventListener('keydown', throttledSetSlide);
    return () => {
      document.removeEventListener('keydown', throttledSetSlide);
    };
  }, [presentationAreaController, townController.ourPlayer.id]);

  const classes = useStyles();

  if (!presentationAreaDocument) {
    return (
      <SelectDocumentModal
        isOpen={selectIsOpen}
        close={() => setSelectIsOpen(false)}
        presentationArea={presentationArea}
      />
    );
  }
  return (
    <>
      <div className={classes.presentationBackground} />
      <div className={classes.documentWrapper}>
        <PresentationAreaDocument
          controller={presentationAreaController}
          initialDocument={presentationAreaDocument}
        />
      </div>
    </>
  );
}

/**
 * The PresentationAreaWrapper is suitable to be *always* rendered inside of a town, and
 * will activate only if the player begins interacting with a presentation area.
 */
export default function PresentationAreaWrapper(): JSX.Element {
  const presentationArea = useInteractable<PresentationAreaInteractable>('presentationArea');
  if (presentationArea) {
    return <PresentationArea presentationArea={presentationArea} />;
  }
  return <></>;
}
