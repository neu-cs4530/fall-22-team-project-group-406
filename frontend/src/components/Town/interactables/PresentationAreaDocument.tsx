import { Container } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PlayerController from '../../../classes/PlayerController';
import PresentationAreaController from '../../../classes/PresentationAreaController';
import { useInteractable, usePresentationAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import PresentationAreaInteractable from './PresentationArea';
import SelectDocumentModal from './SelectDocumentModal';

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
  const [document, setDocument] = useState<string | undefined>(initialDocument);
  const [currentSlide, setCurrentSlide] = useState<number>(controller.slide);
  const townController = useTownController();

  const reactPdfRef = useRef<Document>(null);
  const reactPdfPageRef = useRef<Page>(null);

  useEffect(() => {
    const documentListener = (newDocument: string | undefined) => {
      setDocument(newDocument);
    };
    const slideListener = (newSlide: number) => {
      setCurrentSlide(newSlide);
    };
    controller.addListener('documentChange', documentListener);
    controller.addListener('slideChange', slideListener);
    return () => {
      controller.removeListener('documentChange', documentListener);
      controller.removeListener('slideChange', slideListener);
    };
  }, [controller]);

  return (
    <Container className='participant-wrapper'>
      Presentation Area: {controller.id}
      <Document
        file={document}
        ref={reactPdfRef}
        onLoadSuccess={(pdf: pdfjs.PDFDocumentProxy) => {
          console.log('pdf loaded', pdf);
          controller.numSlides = pdf.numPages;
        }}>
        <Page
          pageIndex={currentSlide}
          ref={reactPdfPageRef}
          onRenderSuccess={() => {
            if (controller.presenter?.id === townController.ourPlayer.id) {
              townController.emitPresentationAreaUpdate(controller);
            }
          }}
        />
      </Document>
    </Container>
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
    presentationAreaController.document === undefined ||
      presentationAreaController.presenter === undefined,
  );
  const [presentationAreaDocument, setPresentationAreaDocument] = useState(
    presentationAreaController.document,
  );
  const [currentPresenter, setCurrentPresenter] = useState(presentationAreaController.presenter);
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
    document.addEventListener('keydown', setSlide);
    return () => {
      document.removeEventListener('keydown', setSlide);
    };
  }, [presentationAreaController, townController.ourPlayer.id]);

  useEffect(() => {
    const setPresenter = (newPresenter: PlayerController | undefined) => {
      setCurrentPresenter(newPresenter);
    };
    presentationAreaController.addListener('presenterChange', setPresenter);
    return () => {
      presentationAreaController.removeListener('presenterChange', setPresenter);
    };
  }, [presentationAreaController, townController.ourPlayer.id]);

  if (!presentationAreaDocument || currentPresenter === undefined) {
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
      <PresentationAreaDocument
        controller={presentationAreaController}
        initialDocument={presentationAreaDocument}
      />
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
